#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { BillingStack } from '../lib/biling-stack';

const app = new cdk.App();
new PipelineStack(app, 'PipelineStack', {});

new BillingStack(app, "BillingStack", {
  budgetAmount: 5,
  emailAddress: "ps6275@gmail.com",
});