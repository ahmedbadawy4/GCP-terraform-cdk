import { TerraformVariable } from "cdktf";
import { Construct } from "constructs";

export class Variables {
  public readonly projectId: TerraformVariable;
  public readonly region: TerraformVariable;
  public readonly environment: TerraformVariable;

  constructor(scope: Construct) {
    this.projectId = new TerraformVariable(scope, "project_id", {
      type: "string",
      description: "The id of the project",
      default: "digital-seat-441309-j5",
    });

    this.region = new TerraformVariable(scope, "region", {
      type: "string",
      description: "The region for resources",
      default: "europe-west3",
    });

    this.environment = new TerraformVariable(scope, "environment", {
      type: "string",
      description: `
      Deployment environment, also used in terraform backend configuration as a workspace name)",
      `,
    });
  }
}
