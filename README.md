# app-work
Monorepo for deploying TypeScript app on Google kubernetes cluster GKE.

## Overview
The application is simply a proof of concept (minimal version) of a complete project of running an application on Google Cloud Kubernetes Engine with a private connection to SQL Server in two environments [development, and production]

*Note: the CI/CD part has not been tested but it is very close to being correct after testing with some tweaks*

## Features
- type script application.
- Dockerfile.
- CI/CD.
- kubernetes manifest files.
- Infrastructure as Code.

### Prerequisites
- Terraform cloud organization and two workspaces (development and production)
- Google Cloud project pre-created.
- Self-hosted runner with cloud access to create resources and publish to GCR and argocd access.
- Google Container Registry (GCR) pre-installed.

### Usage
1. Infrastructure deployment:
- Run the Github action pipeline named `infrastructure Deploy`, described in the `infra-deploy.yaml` file.

    *Notes:*

    *-  The pipeline will auto trigger in pull-request open for the branches dev and main.*

    *- Assuming the branch main targets the production and the branch dev targets the development environment.*

    *- The deploy job only runs with the despatch, push to dev, or push to main.*

    *- In real cases there should be some approval interactions in the GitHub environments to limit the unwanted auto-deployment to the production environments.*


2. Publish the application image:

- Run the Github action pipeline name `Publish Docker Image to GCR` described in the `app-publish.yaml` file.

    *Notes:*

    *- The image should be published for use across all environments as a best practice. assuming one GCR is hosting images in all the environments.*

    *- The pipeline I used basic authentication to Google Cloud, in real case a pre-configured self-hosted runner should be a better option.*

3. application deployment:

- After deploying the infra and publishing the docker image we can install the application to the the new kubernetes cluster using ArgoCD.

    a. Assuming the argoCD is running in the same cluster. Or edit the files in the `argocd` directory with the correct ArgoCD server configuration.

    b. Run the Github action pipeline name `Deploy to Kubernetes` described in the `app-deploy.yaml` file.

    *Notes:*

    *-  The pipeline will auto trigger in pull-request open for the branches dev and main.*

    *- Assuming the branch main targets the production and the branch dev targets the development environment.*

    *- The deploy job only runs with the despatch, push to dev, or push to main.*

    *- In real cases there should be some approval interactions in the GitHub environments to limit the unwanted auto-deployment to the production environments.*

4. pre-commit.
- This part was added to enhance the code quality and limit syntax and style errors.
- Pipeline as a checkpoint for the raised Pull Requests?

## Local run
### Prerequisites
- Node.js (LTS version recommended)
- Docker
- Terraform
- terraform cloud account with Organization and workspace.
- Google Cloud project ID
- Python (>=3.7), pip (Python package manager)

1. Run the application (Mac OS): (in application directory)

    a. Check TypeScript Installation: Ensure TypeScript is installed as a dependency `npm install typescript --save-dev`

    b. Debug Errors: Run tsc directly to see detailed error output `npx tsc`

    c. Node Modules: Ensure dependencies are installed `npm install`

    d. Build the application `node build/index.js`.
      this will pop up a message `Express server is listening at 3000` which means the application exposed on localhost:3000

2. Build a docker image (local)

    a. Buld the docker image `docker build -t sisu-tech .`

    b. Run the image on port 3000 `docker run -p 3000:3000 sisu-tech`

3. Deploy infra using terraform CDK (in terraform directory)

    a. Install cdktf `npm install -g cdktf-cli`

    b. Run `cdktf synth` to generate Terraform JSON configurations.

    b. Run `cdktf diff --var environment=<environment_name> --var project_id=<project_ID>` to display the planned changes

    c. Terraform apply `cdktf diff --var environment=<environment_name> --var project_id=<project_ID>` to deploy the infra.

4. Contribution

    a. Install pre-commit `pip install pre-commit`.

    b. in the root directory Run `pre-commit install`

    c. Commit changes `git commit -m "Your commit message"`

    d. Run `pre-commit run --all-files` to check the changes.

    c. Bypass ( not recommended) Run `git commit --no-verify`
