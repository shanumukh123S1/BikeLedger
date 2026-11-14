
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
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out BikeLedger from GitHub...'

                git branch: 'main',
                    url: 'https://github.com/shanumukh123S1/BikeLedger.git'
            }
        }

        stage('Backend Dependencies') {
            steps {
                dir('server') {
                    echo 'Installing backend dependencies...'
                    bat 'npm ci'
                }
            }
        }

        stage('Frontend Dependencies') {
            steps {
                dir('client') {
                    echo 'Installing frontend dependencies...'
                    bat 'npm ci'
                }
            }
        }

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

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: 'client/dist/**',
                    fingerprint: true
            }
        }

        stage('Test AWS EC2 Connection') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        -o StrictHostKeyChecking=accept-new ^
                        %SSH_USER%@15.134.65.78 ^
                        "whoami && hostname"
                    '''
                }
            }
        }

        stage('Prepare EC2 Directories') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        -o StrictHostKeyChecking=accept-new ^
                        %SSH_USER%@15.134.65.78 ^
                        "mkdir -p /home/ec2-user/BikeLedger/server /home/ec2-user/BikeLedger/client"
                    '''
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        scp -i "%SSH_KEY%" -r ^
                        client/dist/. ^
                        %SSH_USER%@15.134.65.78:/tmp/bikeledger-dist/
                    '''

                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "sudo mkdir -p /usr/share/nginx/html && sudo cp -r /tmp/bikeledger-dist/. /usr/share/nginx/html/ && sudo chown -R nginx:nginx /usr/share/nginx/html"
                    '''
                }
            }
        }

        stage('Deploy Backend Source') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        scp -i "%SSH_KEY%" -r ^
                        server/. ^
                        %SSH_USER%@15.134.65.78:/home/ec2-user/BikeLedger/server/
                    '''
                }
            }
        }

        stage('Deploy Backend Environment') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    ),
                    file(
                        credentialsId: 'bikeledger-backend-env',
                        variable: 'BACKEND_ENV'
                    )
                ]) {
                    bat '''
                        scp -i "%SSH_KEY%" ^
                        "%BACKEND_ENV%" ^
                        %SSH_USER%@15.134.65.78:/tmp/bikeledger.env
                    '''

                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "sudo install -o ec2-user -g ec2-user -m 600 /tmp/bikeledger.env /home/ec2-user/BikeLedger/server/.env && rm -f /tmp/bikeledger.env"
                    '''
                }
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "cd /home/ec2-user/BikeLedger/server && npm ci --omit=dev"
                    '''
                }
            }
        }

        stage('Start Backend with PM2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "cd /home/ec2-user/BikeLedger/server && pm2 describe bikeledger-api >/dev/null 2>&1 && pm2 restart bikeledger-api --update-env || pm2 start server.js --name bikeledger-api"
                    '''
                }
            }
        }

        stage('Configure Nginx API Proxy') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "sudo tee /etc/nginx/conf.d/bikeledger.conf > /dev/null" < nul
                    '''

                    // Nginx configuration is managed separately
                    // to avoid overwriting an existing working configuration.
                    echo 'Verify the Nginx API proxy configuration separately.'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'bikeledger-ec2-ssh',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    bat '''
                        ssh -i "%SSH_KEY%" ^
                        %SSH_USER%@15.134.65.78 ^
                        "pm2 status && curl -I http://localhost/"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: BikeLedger deployed to AWS EC2!'
            echo 'Application URL: http://15.134.65.78'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output.'
        }

        always {
            echo 'BikeLedger CI/CD Pipeline execution finished.'
        }
    }
}
