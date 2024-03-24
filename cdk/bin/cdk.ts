#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const ENV = "morita2"

const app = new cdk.App();
new CdkStack(app, `CdkStack-Env-${ENV}`, {});