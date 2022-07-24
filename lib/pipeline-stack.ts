
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import {Artifact, Pipeline} from "@aws-cdk/aws-codepipeline";
import {CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction} from "@aws-cdk/aws-codepipeline-actions";
import { BuildSpec, LinuxBuildImage, PipelineProject } from "@aws-cdk/aws-codebuild";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const pipeline=  new Pipeline(this, 'Pipeline',{
      pipelineName:"Pipeline",
      crossAccountKeys:false
    });

    const Cdksourceoutput= new Artifact('cdkSourceOutput');
    const Servicesourceoutput= new Artifact('SourceOutput');

    pipeline.addStage({
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
   
    

     const cdkBuildOutput = new Artifact("CdkBuildOutput");

     const ServiceBuildOutput = new Artifact("ServiceBuildOutput");

     pipeline.addStage({
      stageName:'Build', 
      actions:[
        new CodeBuildAction({
          actionName:"CDK_BUILD", 
          input:Cdksourceoutput, 
          outputs:[cdkBuildOutput], 
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
          outputs:[ServiceBuildOutput], 
          project: new PipelineProject(this,'ServiceBuildProject',{
            environment:{
              buildImage:LinuxBuildImage.STANDARD_5_0
            },
            buildSpec:BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')

          })
        })
      ]


     });

     pipeline.addStage({
      stageName:"Pipeline_Update", 
      actions:[
        new CloudFormationCreateUpdateStackAction({
          actionName:'Pipeline_Update', 
          stackName:'PipelineStack', 
          templatePath:cdkBuildOutput.atPath("PipelineStack.template.json"),
          adminPermissions:true
        }),
      ],
     });




  }
}
