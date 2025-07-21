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

async function updateImageInDataset(db, datasetId, imageId, imageData) {
    try {
        console.log('Updating image in dataset:', { datasetId, imageId });
        console.log('Image data to update:', JSON.stringify(imageData));
        
        // First, find the dataset by ID
        const dataset = await db.collection("datasets")
            .findOne({ _id: new ObjectId(datasetId) });
        
        if (!dataset) {
            console.error('Dataset not found with ID:', datasetId);
            throw new Error("Dataset not found");
        }
        
        console.log('Dataset found:', dataset.name, 'with', dataset.images ? dataset.images.length : 0, 'images');
        
        // Debug log the first few image IDs to understand what we're dealing with
        if (dataset.images && dataset.images.length > 0) {
            console.log('First few image IDs in dataset:');
            dataset.images.slice(0, 3).forEach((img, i) => {
                console.log(`Image ${i}:`, img._id, typeof img._id);
            });
        } else {
            console.log('No images in dataset');
        }
        
        // Check what type the imageId is
        console.log('Searching for image with ID:', imageId, typeof imageId);
        
        // Try different approaches to find the image
        let existingImage = null;
        
        // Approach 1: Direct match (for string IDs)
        if (!existingImage && dataset.images) {
            existingImage = dataset.images.find(img => img._id === imageId);
            if (existingImage) console.log('Found by direct string comparison');
        }
        
        // Approach 2: String conversion (for ObjectId vs string)
        if (!existingImage && dataset.images) {
            existingImage = dataset.images.find(img => {
                const imgIdStr = img._id ? img._id.toString() : String(img._id);
                const searchIdStr = imageId ? imageId.toString() : String(imageId);
                return imgIdStr === searchIdStr;
            });
            if (existingImage) console.log('Found by string conversion comparison');
        }
        
        // Approach 3: Just find by index or field matching
        if (!existingImage && dataset.images) {
            // Maybe the image has another unique identifier field?
            existingImage = dataset.images.find(img => {
                // Check if there's any field that matches the imageId
                return img.id === imageId || img.imageId === imageId || img.name === imageId;
            });
            if (existingImage) console.log('Found by alternative field comparison');
        }
        
        if (!existingImage) {
            console.error('No matching image found in dataset');
            // Log the full structure of the first image as an example
            if (dataset.images && dataset.images.length > 0) {
                console.log('Example image structure:', JSON.stringify(dataset.images[0]));
            }
            throw new Error("Image not found in dataset");
        }
        
        console.log('Found existing image:', existingImage._id);
        
        // Create a copy of the existing image data
        const updatedImageData = { ...existingImage };
        
        // Update the fields from the new data
        Object.keys(imageData).forEach(key => {
            updatedImageData[key] = imageData[key];
        });
        
        // Preserve the original _id to ensure we update the correct image
        updatedImageData._id = existingImage._id;
        
        console.log('Updating image with data:', JSON.stringify(updatedImageData));
        
        // Update the image in the dataset
        const result = await db.collection("datasets")
            .updateOne(
                { _id: new ObjectId(datasetId), "images._id": updatedImageData._id },
                { 
                    $set: { 
                        "images.$": updatedImageData,
                        updated_at: new Date() 
                    }
                }
            );
        
        console.log('Update result:', result.matchedCount, 'matched,', result.modifiedCount, 'modified');
        return result;
    }
    catch(err) {
        console.error('Error in updateImageInDataset:', err);
        throw new Error(err.message || err);
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
    updateImageInDataset,
    getDatasetCountByProject
}