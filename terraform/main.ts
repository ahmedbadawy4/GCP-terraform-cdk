import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace, } from "cdktf";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";
import { ContainerCluster } from "@cdktf/provider-google/lib/container-cluster";
import { SqlDatabaseInstance } from "@cdktf/provider-google/lib/sql-database-instance";
import { ComputeNetwork } from "@cdktf/provider-google/lib/compute-network";
import { ComputeFirewall } from "@cdktf/provider-google/lib/compute-firewall";
import { ComputeSubnetwork } from "@cdktf/provider-google/lib/compute-subnetwork";
import { ServiceAccount } from "@cdktf/provider-google/lib/service-account";
import { ComputeGlobalAddress } from "@cdktf/provider-google/lib/compute-global-address";
import { ServiceNetworkingConnection } from "@cdktf/provider-google/lib/service-networking-connection";
import { ProjectIamBinding } from "@cdktf/provider-google/lib/project-iam-binding";
// import { VpcAccessConnector } from "@cdktf/provider-google/lib/vpc-access-connector";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const projectName = "app-work";
    const projectId = "digital-seat-441309-j5";
    const region = "europe-west3";
    
    new CloudBackend(this, {
      hostname: "app.terraform.io",
      organization: "sisu-orgnization",
      
      workspaces: new NamedCloudWorkspace("sisu-workspace"),
    });

    // Google Cloud provider
    new GoogleProvider(this, "Google", {
      region: region,
      project: projectId,
    });
    // VPC network
    const network = new ComputeNetwork(this, "Network", {
      name: `${projectName}-vpc`,
      autoCreateSubnetworks: false,
    });

    // Subnet
    const subnet = new ComputeSubnetwork(this, "Subnet", {
      name: `${projectName}-subnet`,
      ipCidrRange: "10.0.0.0/16",
      region: "europe-west3",
      network: network.id,
      privateIpGoogleAccess: true,
    });

    // // Create a private services access connection
    // const vpcAccessConnector = new VpcAccessConnector(this, "VpcAccessConnector", {
    //   name: "sisu-project-vpc-connector",
    //   region: "us-central1",
    //   network: network.id,
    //   ipCidrRange: "10.8.0.0/28", // Choose a CIDR block in your VPC range
    // });

    // Global Address for Cloud SQL Reserved Range
    const globalAddress = new ComputeGlobalAddress(this, "GlobalAddress", {
      name: `${projectName}-reserved-range`,
      purpose: "VPC_PEERING",
      addressType: "INTERNAL",
      prefixLength: 16,
      network: network.id,
    });

    // VPC Peering for Cloud SQL
    new ServiceNetworkingConnection(this, "VpcPeering", {
      network: network.id,
      service: "servicenetworking.googleapis.com",
      reservedPeeringRanges: [globalAddress.name],
    });

    // Cloud SQL Instance with Private IP
    const sqlInstance = new SqlDatabaseInstance(this, "SQLInstance", {
      name: `${projectName}-sql-instance`,
      region: region,
      databaseVersion: "POSTGRES_13",
      deletionProtection: false,
      settings: {
        tier: "db-f1-micro",
        ipConfiguration: {
          ipv4Enabled: false,
          privateNetwork: `projects/digital-seat-441309-j5/global/networks/${network.name}`,
          authorizedNetworks: [
            {
              name: "VPN Access 2",
              value: "19.104.105.29/32",
            },
            // {
            //   name: "VPN Access 1",
            //   value: "10.26.32.12/32",
            // },
            // already automatically included in networks authorized by Cloud SQL, and can't be added again. Learn more: https://cloud.google.com/sql/docs/mysql/authorize-networks#limitations.
          ],
        },
      },
    });
    // GKE Service Account
    const gkeServiceAccount = new ServiceAccount(this, "GkeServiceAccount", {
      accountId: `${projectName}-gke-sa`,
      displayName: `${projectName} GKE Service Account`,
      project: projectId,
    });

    // IAM Binding for Cloud SQL Client
    new ProjectIamBinding(this, "IamBinding", {
      project: projectId,
      role: "roles/cloudsql.client",
      members: [`serviceAccount:${gkeServiceAccount.email}`],
    });

    // GKE Cluster
    const cluster = new ContainerCluster(this, "GKECluster", {
      name: `${projectName}-gke-cluster`,
      network: network.id,
      subnetwork: subnet.id,
      initialNodeCount: 1,
      deletionProtection: false,
      nodeConfig: {
        machineType: "e2-micro",
        diskSizeGb: 20,
        serviceAccount: gkeServiceAccount.email,
      },
    });

    // IAM Bindings
    new ProjectIamBinding(this, "IamBindingVpcAccessAdmin", {
      project: projectId,
      role: "roles/vpcaccess.admin",
      members: [
        `serviceAccount:terraform-cdk-sa@${projectId}.iam.gserviceaccount.com`,
      ],
    });

    new ProjectIamBinding(this, "IamBindingServiceAccountUser", {
      project: projectId,
      role: "roles/iam.serviceAccountUser",
      members: [
        `serviceAccount:terraform-cdk-sa@${projectId}.iam.gserviceaccount.com`,
      ],
    });

    // Firewall rules for HTTPS and VPN
    new ComputeFirewall(this, "VPNAccessFirewall", {
      name: "allow-vpn-access",
      network: network.id,
      allow: [
        {
          protocol: "tcp",
          ports: ["443"], // HTTPS
        },
      ],
      sourceRanges: ["0.0.0.0/0"],
    });

    new ComputeFirewall(this, "ClusterVPNAccess", {
      name: "vpn-access",
      network: network.id,
      allow: [
        {
          protocol: "all",
        },
      ],
      sourceRanges: ["10.26.32.12/32", "19.104.105.29/32"],
    });

    console.log("Cloud SQL Private IP:", sqlInstance.privateIpAddress);
    console.log("GKE Cluster ID:", cluster.id);
  }
}

const app = new App();
new MyStack(app, "terraform");
app.synth();
