const { ObjectId } = require("mongodb");
const projectModel = require("./projectModel");
const dataset ={
    name:{
        type:String,
        required:true
    },
    organization_id:{
        type:ObjectId,
        required:true
    },
    projectId:{
        type:ObjectId,
        required:true
    },
    images:[],
    created_at:{
        type:Date,
        default:Date.now
    },
    updated_at:{
        type:Date,
        default:Date.now
    }
}

async function createDataset(db,data){
    try{
        const project = await projectModel.findProjectById(db,data.projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        data.organization_id = project.organization_id;
        data.created_at = new Date();
        data.updated_at = new Date();
        const result = await db.collection("datasets").insertOne(data);
        return await db.collection("datasets").findOne({ _id: result.insertedId });
    }
    catch(err){
        throw new Error(err);
    }
}

async function findDatasetById(db,id){
    try{
        return await db.collection("datasets").findOne({ _id: new ObjectId(id) });
    }
    catch(err){
        throw new Error(err);
    }
}

async function findDatasetByProjectId(db,id){
    try{
        return await db.collection("datasets").find({ projectId: new ObjectId(id) }).toArray();
    }
    catch(err){
        throw new Error(err);
    }
}

async function updateDataset(db,id,data){
    try{
        const result = await db.collection("datasets").updateOne({ _id: new ObjectId(id) }, { $set: data });
        return await db.collection("datasets").findOne({ _id: new ObjectId(id) });
    }
    catch(err){
        throw new Error(err);
    }
}

async function deleteDataset(db,id){
    try{
        const result = await db.collection("datasets").deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }
    catch(err){
        throw new Error(err);
    }
}

// Find datasets by organization ID
async function findDatasetByOrganizationId(db, organizationId) {
    try {
        return await db.collection("datasets")
            .find({ organization_id: new ObjectId(organizationId) })
            .toArray();
    }
    catch(err) {
        throw new Error(err);
    }
}

// Add image to dataset
async function addImageToDataset(db, datasetId, imageData) {
    try {
        const result = await db.collection("datasets")
            .updateOne(
                { _id: new ObjectId(datasetId) },
                { 
                    $push: { images: imageData },
                    $set: { updated_at: new Date() }
                }
            );
        return result.modifiedCount > 0;
    }
    catch(err) {
        throw new Error(err);
    }
}

// Remove image from dataset
async function removeImageFromDataset(db, datasetId, imageId) {
    try {
        const result = await db.collection("datasets")
            .updateOne(
                { _id: new ObjectId(datasetId) },
                { 
                    $pull: { images: { _id: new ObjectId(imageId) } },
                    $set: { updated_at: new Date() }
                }
            );
        return result.modifiedCount > 0;
    }
    catch(err) {
        throw new Error(err);
    }
}

// Get dataset count by project
async function getDatasetCountByProject(db, projectId) {
    try {
        return await db.collection("datasets")
            .countDocuments({ projectId: new ObjectId(projectId) });
    }
    catch(err) {
        throw new Error(err);
    }
}

module.exports = {
    createDataset,
    findDatasetById,
    findDatasetByProjectId,
    findDatasetByOrganizationId,
    updateDataset,
    deleteDataset,
    addImageToDataset,
    removeImageFromDataset,
    getDatasetCountByProject
}