export interface StackPreset {
  label: string;
  value: string;
}

export const STACK_PRESETS: StackPreset[] = [
  {
    label: "MERN Stack",
    value: "MongoDB + Express.js + React + Node.js, deployed on a single EC2 instance behind Nginx",
  },
  {
    label: "Kubernetes Microservices",
    value: "Kubernetes cluster running microservices with Istio service mesh, Helm charts, and an internal Redis cache",
  },
  {
    label: "WordPress Enterprise",
    value: "WordPress Enterprise with WooCommerce, MySQL, custom plugins, and a shared cPanel hosting environment",
  },
  {
    label: "Serverless AWS",
    value: "AWS Lambda + API Gateway + DynamoDB + Cognito serverless application with S3 static frontend",
  },
  {
    label: "Node REST + Postgres + S3",
    value: "Node.js REST API + PostgreSQL + AWS S3 Bucket + Docker containers orchestrated via docker-compose",
  },
  {
    label: "Legacy .NET Monolith",
    value: "Legacy ASP.NET MVC monolith on IIS with MSSQL Server and on-prem Active Directory integration",
  },
];
