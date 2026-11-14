
// pipeline {
//     agent any

//     options {
//         timestamps()
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 echo 'Checking out BikeLedger from GitHub...'

//                 git branch: 'main',
//                     url: 'https://github.com/shanumukh123S1/BikeLedger.git'
//             }
//         }

//         stage('Backend Dependencies') {
//             steps {
//                 dir('server') {
//                     echo 'Installing backend dependencies...'
//                     bat 'npm ci'
//                 }
//             }
//         }

//         stage('Frontend Dependencies') {
//             steps {
//                 dir('client') {
//                     echo 'Installing frontend dependencies...'
//                     bat 'npm ci'
//                 }
//             }
//         }

//         stage('Frontend Production Build') {
//             steps {
//                 dir('client') {
//                     echo 'Building React frontend...'
//                     bat 'npm run build'
//                 }
//             }
//         }

//         stage('Archive Build') {
//             steps {
//                 archiveArtifacts artifacts: 'client/dist/**',
//                     fingerprint: true
//             }
//         }
//     }

//     post {
//         success {
//             echo 'SUCCESS: BikeLedger Traditional CI Pipeline completed!'
//         }

//         failure {
//             echo 'FAILED: Check the Jenkins Console Output for errors.'
//         }

//         always {
//             echo 'BikeLedger CI Pipeline execution finished.'
//         }
//     }
// }


pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        EC2_HOST = '15.134.65.78'
        EC2_USER = 'ec2-user'
        EC2_APP_DIR = '/home/ec2-user/BikeLedger'

        SSH_CREDENTIAL = 'bikeledger-ec2-ssh'
        ENV_CREDENTIAL = 'bikeledger-backend-env'

        FRONTEND_DIR = '/usr/share/nginx/html'
    }

    stages {

        // 1. CHECKOUT
        stage('Checkout') {
            steps {
                echo 'Checking out BikeLedger from GitHub...'

                git branch: 'main',
                    url: 'https://github.com/shanumukh123S1/BikeLedger.git'
            }
        }

        // 2. BACKEND DEPENDENCIES
        stage('Backend Dependencies') {
            steps {
                dir('server') {
                    echo 'Installing backend dependencies...'
                    bat 'npm ci'
                }
            }
        }

        // 3. FRONTEND DEPENDENCIES
        stage('Frontend Dependencies') {
            steps {
                dir('client') {
                    echo 'Installing frontend dependencies...'
                    bat 'npm ci'
                }
            }
        }

        // 4. FRONTEND BUILD
        stage('Frontend Production Build') {
            steps {
                dir('client') {
                    echo 'Building React frontend...'

                    withEnv(['VITE_API_URL=/api']) {
                        bat 'npm run build'
                    }
                }
            }
        }

        // 5. CREATE DEPLOYMENT ARCHIVES
        stage('Prepare Deployment Archives') {
            steps {
                echo 'Creating clean deployment archives...'

                bat '''
                    if exist bikeledger-server.tar.gz del bikeledger-server.tar.gz
                    if exist bikeledger-dist.tar.gz del bikeledger-dist.tar.gz

                    tar -czf bikeledger-server.tar.gz --exclude=node_modules --exclude=.env --exclude=.git -C server .

                    if errorlevel 1 exit /b 1

                    tar -czf bikeledger-dist.tar.gz -C client/dist .

                    if errorlevel 1 exit /b 1
                '''

                writeFile file: 'bikeledger-nginx.conf', text: '''
server {
    listen 80;
    listen [::]:80;

    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
'''
            }
        }

        // 6. ARCHIVE BUILD
        stage('Archive Build') {
            steps {
                archiveArtifacts(
                    artifacts: 'client/dist/**,bikeledger-server.tar.gz,bikeledger-dist.tar.gz',
                    fingerprint: true
                )
            }
        }
        
        stage('Identify Jenkins Windows Account') {
            steps {
                bat '''
                echo ===== WINDOWS USER =====
                whoami
                echo ===== USER SID =====
                whoami /user
                echo ===== USER ENVIRONMENT =====
                set USER
                '''
            }
        }

        // 7. TEST SSH CONNECTION
        stage('Test AWS EC2 Connection') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=accept-new %SSH_USER%@%EC2_HOST% "whoami && hostname"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 8. PREPARE EC2 DIRECTORIES
        stage('Prepare EC2 Directories') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "mkdir -p %EC2_APP_DIR%/server /tmp/bikeledger-deploy"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 9. DEPLOY BACKEND SOURCE
        stage('Deploy Backend Source') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        scp -i "%SSH_KEY%" bikeledger-server.tar.gz %SSH_USER%@%EC2_HOST%:/tmp/bikeledger-deploy/server.tar.gz

                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "tar -xzf /tmp/bikeledger-deploy/server.tar.gz -C %EC2_APP_DIR%/server"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 10. DEPLOY BACKEND ENVIRONMENT
        stage('Deploy Backend Environment') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    file(
                        credentialsId: "${ENV_CREDENTIAL}",
                        variable: 'BACKEND_ENV'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        scp -i "%SSH_KEY%" "%BACKEND_ENV%" %SSH_USER%@%EC2_HOST%:/tmp/bikeledger-deploy/backend.env

                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "install -o ec2-user -g ec2-user -m 600 /tmp/bikeledger-deploy/backend.env %EC2_APP_DIR%/server/.env && rm -f /tmp/bikeledger-deploy/backend.env"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 11. INSTALL PRODUCTION DEPENDENCIES
        stage('Install Backend Dependencies') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "cd %EC2_APP_DIR%/server && npm ci --omit=dev"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 12. DEPLOY FRONTEND
        stage('Deploy Frontend') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        scp -i "%SSH_KEY%" bikeledger-dist.tar.gz %SSH_USER%@%EC2_HOST%:/tmp/bikeledger-deploy/frontend.tar.gz

                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "sudo mkdir -p %FRONTEND_DIR% && sudo find %FRONTEND_DIR% -mindepth 1 -maxdepth 1 -exec rm -rf {} + && sudo tar -xzf /tmp/bikeledger-deploy/frontend.tar.gz -C %FRONTEND_DIR% && sudo chown -R nginx:nginx %FRONTEND_DIR%"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 13. CONFIGURE NGINX
        stage('Configure Nginx API Proxy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        scp -i "%SSH_KEY%" bikeledger-nginx.conf %SSH_USER%@%EC2_HOST%:/tmp/bikeledger-nginx.conf

                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "sudo rm -f /etc/nginx/conf.d/default.conf && sudo install -m 644 /tmp/bikeledger-nginx.conf /etc/nginx/conf.d/bikeledger.conf && sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 14. START BACKEND USING PM2
        stage('Start Backend with PM2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "cd %EC2_APP_DIR%/server && if pm2 describe bikeledger-api >/dev/null 2>&1; then pm2 restart bikeledger-api --update-env; else pm2 start server.js --name bikeledger-api; fi && pm2 save"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        // 15. VERIFY DEPLOYMENT
        stage('Verify Deployment') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${SSH_CREDENTIAL}",
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        if errorlevel 1 exit /b 1

                        icacls "%SSH_KEY%" /grant:r "%USERNAME%:R"
                        if errorlevel 1 exit /b 1

                        ssh -i "%SSH_KEY%" %SSH_USER%@%EC2_HOST% "pm2 status && curl -fsS http://localhost/ -o /dev/null && echo FRONTEND_OK && curl -sS -o /dev/null -w 'BACKEND_HTTP_STATUS: %%{http_code}\\n' http://localhost:5000/"

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: BikeLedger CI/CD deployment completed!'
            echo 'Application URL: http://15.134.65.78'
        }

        failure {
            echo 'FAILED: BikeLedger CI/CD pipeline failed.'
            echo 'Check the first failed stage in Console Output.'
        }

        always {
            echo 'BikeLedger CI/CD Pipeline execution finished.'
        }
    }
}
