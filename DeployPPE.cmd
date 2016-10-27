@echo off
@rem Run from the root of master to deploy the currently built contents
@rem of the out\ directory to PPE.

@echo =================================================================
@echo PPE Deployment
@echo Checking out DeployPPE branch which is configured in
@echo Azure App Service to automatically deploy to the PPE
@echo ZombAttack site.
@echo =================================================================
call git checkout DeployPPE
if ERRORLEVEL 1 echo ERROR: Git checkout failed && exit /b 1

@echo =================================================================
@echo Copying build in the out\ directory to the PPE deployment
@echo directory.
@echo =================================================================
robocopy.exe out\. Deployed\PPE\. /s /mir
if ERRORLEVEL 8 echo ERROR: Robocopy failed with errorlevel %ERRORLEVEL%. && exit /b 1

@echo =================================================================
@echo Committing and pushing copied deployment.
@echo =================================================================
robocopy.exe out\. DeployPPE\. /s /mir
if ERRORLEVEL 8 echo ERROR: Robocopy failed with errorlevel %ERRORLEVEL%. && exit /b 1


exit /b 0
