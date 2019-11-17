import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');

export class CdkAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'JupiterLabVpc', { maxAzs: 1 });
    const cluster = new ecs.Cluster(this, 'JupiterLabEc2Cluster', { vpc });

    // create a task definition with CloudWatch Logs
    const logging = new ecs.AwsLogDriver({
      streamPrefix: "jupiter_lab",
    })

    const taskDef = new ecs.FargateTaskDefinition(this, "JupiterLabTaskDefinition", {
      memoryLimitMiB: 512,
      cpu: 256,
    })

    const container = taskDef.addContainer("JupiterLabContainer", {
      image: ecs.ContainerImage.fromRegistry("jupyter/datascience-notebook"),
      logging,
    })

    container.addPortMappings({
      containerPort: 8888,
      hostPort: 8888,
      protocol: ecs.Protocol.TCP,
    })

    // Create a security group that allows HTTP traffic on port 80 for our containers without modifying the security group on the instance
    const securityGroup = new ec2.SecurityGroup(this, 'JupiterLabSecurityGroup', {
      vpc,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8888));

    // Instantiate ECS Service with just cluster and image
    new ecs.FargateService(this, "JupiterLabFargateService", {
      cluster,
      taskDefinition: taskDef,
      securityGroup: securityGroup,
      assignPublicIp: true
    });
  }
}
