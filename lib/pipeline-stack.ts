
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import {Artifact, Pipeline} from "@aws-cdk/aws-codepipeline";
import {CodeBuildAction, GitHubSourceAction} from "@aws-cdk/aws-codepipeline-actions";
import { BuildSpec, LinuxBuildImage, PipelineProject } from "@aws-cdk/aws-codebuild";

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const pipeline=  new Pipeline(this, 'Pipeline',{
      pipelineName:"Pipeline",
      crossAccountKeys:false
    });

    const sourceoutput= new Artifact('SourceOutput');

    pipeline.addStage({
      stageName:"Source",
      actions:[
        new GitHubSourceAction({
          owner:"pradumna123",
          repo:"aws-pipeline",
          branch:"main",
          actionName:"Pipeline_Source", 
          oauthToken:SecretValue.secretsManager('github-token'),
          output:sourceoutput
        })
      ]
    })
   
    

     const cdkBuildOutput = new Artifact("CdkBuildOutput");

     pipeline.addStage({
      stageName:'Build', 
      actions:[
        new CodeBuildAction({
          actionName:"CDK_BUILD", 
          input:sourceoutput, 
          outputs:[cdkBuildOutput], 
          project: new PipelineProject(this,'CdkBuildProject',{
            environment:{
              buildImage:LinuxBuildImage.STANDARD_5_0
            },
            buildSpec:BuildSpec.fromSourceFilename('build-spec/cdk-build-spec.yml')

          })
        })
      ]


     });




  }
}
