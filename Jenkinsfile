
pipeline {
    agent any

    options {
        timestamps()
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
                    bat 'npm run build'
                }
            }
        }

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: 'client/dist/**',
                    fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: BikeLedger Traditional CI Pipeline completed!'
        }

        failure {
            echo 'FAILED: Check the Jenkins Console Output for errors.'
        }

        always {
            echo 'BikeLedger CI Pipeline execution finished.'
        }
    }
}
