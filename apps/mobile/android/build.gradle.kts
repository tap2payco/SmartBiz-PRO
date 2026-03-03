allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val safeBuildPath = "C:/tmp/smartbiz_mobile_build"
val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir(safeBuildPath)
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
