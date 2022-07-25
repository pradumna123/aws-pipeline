
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import {Artifact, Pipeline} from "@aws-cdk/aws-codepipeline";
import {CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction} from "@aws-cdk/aws-codepipeline-actions";
import { BuildSpec, LinuxBuildImage, PipelineProject } from "@aws-cdk/aws-codebuild";
import { ServiceStack } from "./service-stack";

export class PipelineStack extends Stack {
  private readonly pipeline:Pipeline;
  private readonly cdkBuildOutput:Artifact;
  private readonly ServiceBuildOutput:Artifact;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


     this.pipeline=  new Pipeline(this, 'Pipeline',{
      pipelineName:"Pipeline",
      crossAccountKeys:false, 
      restartExecutionOnUpdate:true,
    });

    const Cdksourceoutput= new Artifact('cdkSourceOutput');
    const Servicesourceoutput= new Artifact('SourceOutput');

    this.pipeline.addStage({
      stageName:"Source",
      actions:[
        new GitHubSourceAction({
          owner:"pradumna123",
          repo:"aws-pipeline",
          branch:"main",
          actionName:"Pipeline_Source", 
          oauthToken:SecretValue.secretsManager('github-token'),
          output:Cdksourceoutput
        }),
        
          new GitHubSourceAction({
            owner:"pradumna123",
            repo:"express-lambda",
            branch:"main",
            actionName:"Service_Source", 
            oauthToken:SecretValue.secretsManager('github-token'),
            output:Servicesourceoutput 
          })
      ]
    })
   
    

      this.cdkBuildOutput = new Artifact("CdkBuildOutput");

      this.ServiceBuildOutput = new Artifact("ServiceBuildOutput");

     this.pipeline.addStage({
      stageName:'Build', 
      actions:[
        new CodeBuildAction({
          actionName:"CDK_BUILD", 
          input:Cdksourceoutput, 
          outputs:[this.cdkBuildOutput], 
          project: new PipelineProject(this,'CdkBuildProject',{
            environment:{
              buildImage:LinuxBuildImage.STANDARD_5_0
            },
            buildSpec:BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')

          })
        }),
        new CodeBuildAction({
          actionName:"SERVICE_BUILD", 
          input:Servicesourceoutput, 
          outputs:[this.ServiceBuildOutput], 
          project: new PipelineProject(this,'ServiceBuildProject',{
            environment:{
              buildImage:LinuxBuildImage.STANDARD_5_0
            },
            buildSpec:BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')

          })
        }),
      ]


     });

     this.pipeline.addStage({
      stageName:"Pipeline_Update", 
      actions:[
        new CloudFormationCreateUpdateStackAction({
          actionName:'Pipeline_Update', 
          stackName:'PipelineStack', 
          templatePath:this.cdkBuildOutput.atPath("PipelineStack.template.json"),
          adminPermissions:true
        }),
      ],
     });


    

  }


  public addServiceStage(serviceStack: ServiceStack, stageName: string) {
    this.pipeline.addStage({
      stageName: stageName,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "Service_Update",
          stackName: serviceStack.stackName,
          templatePath: this.cdkBuildOutput.atPath(
            `${serviceStack.stackName}.template.json`
          ),
          adminPermissions: true,
          parameterOverrides: {
            ...serviceStack.serviceCode.assign(
              this.ServiceBuildOutput.s3Location
            ),
          },
          extraInputs: [this.ServiceBuildOutput],
        }),
      ],
    });
  }
  

  
}
