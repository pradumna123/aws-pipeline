
import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { CfnParametersCode, Code , Function,Runtime} from "@aws-cdk/aws-lambda";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import {LambdaProxyIntegration} from "@aws-cdk/aws-apigatewayv2-integrations";
export class ServiceStack extends Stack{
    public readonly serviceCode : CfnParametersCode

    constructor(scope:Construct, id:string, props?: StackProps){
        super(scope, id, props);

        this.serviceCode= Code.fromCfnParameters()

      const lambda=  new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_14_X, 
            handler:"'src/lambda.handler", 

            // here we can specify where the code for exists
            code:this.serviceCode,
            functionName:'ServiceLambda'
        });

        new HttpApi(this, "ServiceAPI", {
            // redirects any request to lambda 
            defaultIntegration: new LambdaProxyIntegration({
handler:lambda
            }),
            apiName:"MyService"
        });




    }

}