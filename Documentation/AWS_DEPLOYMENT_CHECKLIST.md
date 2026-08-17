# AWS Deployment Checklist

## Pre-Deployment Planning

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    Internet (0.0.0.0/0)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Application Load      │
        │  Balancer (ALB)        │
        │  - Port 80/443         │
        │  - Health Check: /health
        └────────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌─────────┐            ┌─────────┐
    │   EC2   │            │   EC2   │
    │ Instance│            │ Instance│  (Auto Scaling Group)
    │   (API) │            │   (API) │
    │ Port 5000           │ Port 5000
    └────┬────┘            └────┬────┘
         │                      │
         └──────────┬───────────┘
                    │ (Restricted: Only EC2 SG)
                    ▼
         ┌─────────────────────┐
         │  AWS RDS PostgreSQL │
         │  - Port 5432        │
         │  - Encrypted        │
         │  - Automated Backup │
         │  - Multi-AZ (Prod)  │
         └─────────────────────┘
```

---

## Pre-Deployment Checklist

### [ ] 1. AWS Account Setup
- [ ] AWS Account created and verified
- [ ] Billing alerts configured
- [ ] IAM user created (not using root)
- [ ] MFA enabled on IAM user
- [ ] AWS CLI configured (`aws configure`)
- [ ] Access keys stored securely (NOT in git)

### [ ] 2. VPC & Network Setup
- [ ] VPC created (or use default)
- [ ] Public subnet created (for ALB)
- [ ] Private subnet created (for RDS)
- [ ] NAT Gateway configured (for private EC2 to reach internet)
- [ ] Route tables configured
- [ ] VPC Flow Logs enabled (for security monitoring)

### [ ] 3. Security Group Creation
- [ ] ALB Security Group:
  - [ ] Inbound: HTTP 80 (0.0.0.0/0)
  - [ ] Inbound: HTTPS 443 (0.0.0.0/0)
  - [ ] Outbound: All traffic to API SG
  
- [ ] EC2 Security Group (API):
  - [ ] Inbound: TCP 5000 from ALB SG only
  - [ ] Inbound: SSH 22 from your IP only (not 0.0.0.0/0)
  - [ ] Outbound: TCP 5432 to RDS SG
  - [ ] Outbound: TCP 443 (for Docker pulls, pip)
  
- [ ] RDS Security Group (Database):
  - [ ] Inbound: TCP 5432 from EC2 SG only
  - [ ] Inbound: NO access from 0.0.0.0/0
  - [ ] Outbound: None required (DB doesn't initiate)

### [ ] 4. Key Pair & SSH Access
- [ ] EC2 Key Pair created and downloaded
- [ ] Key pair permissions: `chmod 400 key.pem`
- [ ] Key pair stored in secure location (~/.ssh/)
- [ ] Key pair backed up securely (not in git)

---

## Deployment Steps

### Step 1: Create RDS PostgreSQL Instance

```bash
# Variables
DB_INSTANCE=task-api-db-prod
DB_MASTER_USER=postgres
DB_PASSWORD=$(openssl rand -hex 16)  # Store this securely
SECURITY_GROUP_ID=sg-056e9da513f17b98c

# Create RDS instance with security hardening
aws rds create-db-instance \
  --db-instance-identifier $DB_INSTANCE \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username $DB_MASTER_USER \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:region:account-id:key/key-id \
  --vpc-security-group-ids $SECURITY_GROUP_ID \
  --backup-retention-period 7 \
  --enable-cloudwatch-logs-exports postgresql \
  --enable-iam-database-authentication \
  --multi-az \
  --deletion-protection \


# Wait for DB to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### Step 2: Create EC2 Instance

```bash
# Variables
KEY_NAME=my-flask-key
SECURITY_GROUP_ID=sg-06b5b51f9fafe7c16
SUBNET_ID=subnet-0176dcb3677538409

# Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-01a00762f46d584a1 \
  --instance-type t3.micro \
  --key-name $KEY_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --subnet-id $SUBNET_ID \
  --iam-instance-profile Name=TaskAPIEC2Role \
  --monitoring Enabled=true \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=task-api-prod},{Key=Environment,Value=production}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance created: $INSTANCE_ID"

# Get public IP
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

### Step 3: Configure EC2 Instance

```bash
# SSH into instance
ssh -i key.pem ubuntu@<public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install git
sudo apt install git -y

# Clone repository
git clone https://github.com/Umar-cloud7/Flask_API.git
cd Flask_API

# Create .env file with RDS credentials
# Create .env file with unexpanded variables for Docker, and evaluate JWT secret immediately
cat > .env << EOF
DATABASE_URL=postgresql://\$DB_USER:\$DB_PASSWORD@\$RDS_ENDPOINT:5432/taskdb
JWT_SECRET_KEY=$(openssl rand -hex 32)
FLASK_ENV=production
EOF

# Set strict permissions
chmod 600 .env

# Start application
docker-compose up -d

# Verify container is running
docker-compose ps

# Check logs
docker-compose logs -f api
```

### Step 4: Create Application Load Balancer

```bash
# Variables
ALB_NAME=task-api-alb-prod
TARGET_GROUP_NAME=task-api-targets
VPC_ID=vpc-xxxxxxxx

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name $ALB_NAME \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-alb-xxxxxxxx \
  --scheme internet-facing \
  --type application \
  --tags Key=Name,Value=$ALB_NAME \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Get ALB DNS name
aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' --output text

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name $TARGET_GROUP_NAME \
  --protocol HTTP \
  --port 5000 \
  --vpc-id $VPC_ID \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --target-type instance \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Register EC2 instance as target
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID Port=5000

# Create listener (HTTP → HTTPS redirect recommended for production)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Step 5: Enable HTTPS (Optional but Recommended)

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name api.example.com \
  --subject-alternative-names www.api.example.com \
  --validation-method DNS

# Verify domain ownership (follow DNS CNAME validation)
# Then update ALB listener:
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:...
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### Step 6: Set Up Auto Scaling (Recommended for Production)

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name task-api-template \
  --version-description "Flask API with Docker" \
  --launch-template-data '{
    "ImageId":"ami-0c55b159cbfafe1f0",
    "InstanceType":"t3.micro",
    "KeyName":"my-flask-key",
    "SecurityGroupIds":["sg-api-xxxxxxxx"],
    "UserData":"IyEvYmluL2Jhc2gKc3VkbyBhcHQgdXBkYXRlICYmIHN1ZG8gYXB0IGluc3RhbGwgLXkgZG9ja2VyLmlvCi4uLg=="
  }'

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name task-api-asg \
  --launch-template LaunchTemplateName=task-api-template \
  --min-size 2 \
  --max-size 4 \
  --desired-capacity 2 \
  --vpc-zone-identifier "subnet-xxxxxxxx,subnet-yyyyyyyy" \
  --target-group-arns $TG_ARN \
  --health-check-type ELB \
  --health-check-grace-period 300
```

---

## Post-Deployment Verification

### [ ] 1. Health Checks
```bash
# Test API health endpoint
curl http://<alb-dns>/health

# Check container logs
ssh -i key.pem ubuntu@<ec2-ip>
docker-compose logs -f api

# Verify database connectivity
docker-compose exec api python -c \
  "from app import db; db.session.execute('SELECT 1')"
```

### [ ] 2. Security Verification
```bash
# Verify security groups (no 0.0.0.0/0 on RDS)
aws ec2 describe-security-groups --group-ids sg-rds-xxxxxxxx

# Verify RDS encryption enabled
aws rds describe-db-instances \
  --db-instance-identifier task-api-db-prod \
  --query 'DBInstances[0].StorageEncrypted'

# Verify SSL/TLS on ALB
aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN
```

### [ ] 3. Performance Testing
```bash
# From local machine:
ab -n 1000 -c 10 http://<alb-dns>/health

# Or use Apache Bench or hey tool
```

### [ ] 4. Monitoring Setup
```bash
# Enable detailed CloudWatch monitoring
aws ec2 monitor-instances --instance-ids $INSTANCE_ID

# Create dashboard for monitoring
aws cloudwatch put-dashboard \
  --dashboard-name TaskAPI \
  --dashboard-body file://dashboard.json
```

---

## Security Hardening Checklist

### [ ] Network Security
- [ ] EC2 in private subnet (if not ALB-facing)
- [ ] RDS in private subnet only
- [ ] Security groups follow principle of least privilege
- [ ] VPC Flow Logs enabled
- [ ] WAF rules configured on ALB (optional)

### [ ] Database Security
- [ ] RDS encryption at rest enabled
- [ ] Backup retention set to 7+ days
- [ ] Automated backup window configured
- [ ] Parameter group hardened (no default settings)
- [ ] Enhanced Monitoring enabled
- [ ] Database password stored in AWS Secrets Manager

### [ ] Application Security
- [ ] .env file NOT committed to git
- [ ] Docker runs as non-root user
- [ ] JWT_SECRET_KEY generated with `openssl rand -hex 32`
- [ ] FLASK_ENV=production
- [ ] Logging configured for all API calls
- [ ] Error responses don't expose stack traces

### [ ] Access Control
- [ ] IAM roles follow least privilege
- [ ] EC2 instance has minimal IAM permissions
- [ ] SSH key securely stored (chmod 400)
- [ ] Only necessary ports exposed
- [ ] Bastion host used for production RDS access (optional)

### [ ] Monitoring & Logging
- [ ] CloudWatch Logs enabled for RDS
- [ ] Application logs exported to CloudWatch
- [ ] CloudWatch alarms set for:
  - [ ] High error rate (> 5%)
  - [ ] Database connection failures
  - [ ] CPU > 80%
  - [ ] Network in/out anomalies
- [ ] SNS notifications configured for alarms

---

## Disaster Recovery & Backup

### [ ] Backup Strategy
- [ ] RDS automated backups enabled (7+ days)
- [ ] Manual snapshots taken before major updates
- [ ] Cross-region snapshot copy (for high availability)
- [ ] Backup restoration tested monthly

### [ ] Disaster Recovery Plan
- [ ] RDS failover (Multi-AZ) tested
- [ ] Auto Scaling Group tested
- [ ] Database restore procedure documented
- [ ] Recovery time objective (RTO) < 1 hour
- [ ] Recovery point objective (RPO) < 15 minutes

---

## Cost Optimization

### Estimated Monthly Costs
- EC2 t3.micro: ~$8-10
- RDS db.t3.micro: ~$15-20
- ALB: ~$20-25
- Data transfer: ~$5-10
- **Total: ~$50-65/month**

### [ ] Cost Optimization Steps
- [ ] Reserved instances (save 40% on EC2)
- [ ] RDS Reserved Instance (save 40-50%)
- [ ] S3 lifecycle policies for old backups
- [ ] CloudWatch log retention set to 30 days
- [ ] Unused resources cleaned up

---

## Interview Talking Points

1. **Architecture Decisions:**
   - "Chose ALB for layer 7 routing and health checks"
   - "RDS Multi-AZ for automatic failover"
   - "Auto Scaling for handling traffic spikes"

2. **Security Implementation:**
   - "Encrypted RDS with KMS keys"
   - "Security groups restrict access to only necessary ports"
   - "Non-root Docker user follows least privilege principle"

3. **Monitoring & Operations:**
   - "CloudWatch alarms alert on errors and performance"
   - "Health checks ensure failed instances are replaced"
   - "Automated backups provide RPO < 15 minutes"

4. **Cost Management:**
   - "Reserved instances reduce costs by 40%"
   - "Auto Scaling ensures we pay only for what we use"
   - "Estimated ~$50/month for production deployment"

---

## Cleanup (Delete All Resources)

```bash
# WARNING: This deletes all resources!

# Delete ASG
aws autoscaling delete-auto-scaling-group \
  --auto-scaling-group-name task-api-asg --force-delete

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete target group
aws elbv2 delete-target-group --target-group-arn $TG_ARN

# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Delete RDS instance
aws rds delete-db-instance \
  --db-instance-identifier task-api-db-prod \
  --skip-final-snapshot

# Delete security groups (after instances are terminated)
aws ec2 delete-security-group --group-id sg-xxxxx
```

---

## References
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [EC2 Security](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security.html)
- [ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
