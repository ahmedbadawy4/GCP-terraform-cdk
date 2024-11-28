import { DataGoogleProject } from "@cdktf/provider-google/lib/data-google-project";
import { Construct } from "constructs";

export class DataSources {
  public readonly projectData: DataGoogleProject;
  constructor(scope: Construct, projectId: string) {
    this.projectData = new DataGoogleProject(scope, "projectData", {
      projectId: projectId,
    });
  }
}
