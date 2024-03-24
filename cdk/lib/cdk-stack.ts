import { Construct } from 'constructs';
import {
  Stack,
  StackProps,
  aws_s3,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3_deployment,
  aws_iam,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';
import * as path from 'path';

const ENV = "morita2"

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /** ---------------------------------------------------------------
     * １．S3バケットの作成
     ---------------------------------------------------------------- */ 

    /**
     * S3バケット作成
     * @remarks
     * autoDeleteObjects : true にしていないとオブジェクトが中に存在していると削除できなくなる
     */
    const websiteBucket = new aws_s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `cdk-handson-${ENV}-web-bucket`, // backet名
      removalPolicy: RemovalPolicy.DESTROY,  // 削除可能
      autoDeleteObjects: true, // 削除する際に自動的に中のオブジェクトも削除
    });

    const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: 'website-distribution-originAccessIdentity',
      }
    );

    // S3バケットに付与するポリシー
    const webSiteBucketPolicyStatement = new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [
        new aws_iam.CanonicalUserPrincipal(
          originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [`${websiteBucket.bucketArn}/*`],
    });

    // バケットにポリシーを付与
    websiteBucket.addToResourcePolicy(webSiteBucketPolicyStatement);

    // １．ここまで-----------------------------------------------------


    /** ---------------------------------------------------------------
     * ２．S3バケットにファイルを追加
     ---------------------------------------------------------------- */ 

    /**
     * 静的ホスティング用S3バケットにファイルをアップロード
     */
    const indexHtmlPath = path.resolve(__dirname, '../../web/src/index.html');
    new aws_s3_deployment.BucketDeployment(this, 'WebsiteDeploy', {
      sources: [aws_s3_deployment.Source.asset(path.dirname(indexHtmlPath))],
      destinationBucket: websiteBucket,
    });
    // ２．ここまで-----------------------------------------------------

    /** ---------------------------------------------------------------
     * ３．CloudFrontを追加
     ---------------------------------------------------------------- */ 

    /**
     * cloudFrontを作成
     */
    const distribution = new aws_cloudfront.Distribution(this, 'distribution', {
      comment: `env-${ENV}-website-distribution`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy:
          aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new aws_cloudfront_origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
      },
      priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_ALL,
    });

    // ３．ここまで--------------------------------------------------------

  }
}


