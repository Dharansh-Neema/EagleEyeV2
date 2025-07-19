const { ObjectId } = require("mongodb");

const dataset ={
    name:{
        type:String,
        required:true
    },
    organization_id:{
        type:ObjectId,
        required:true
    },
    project_id:{
        type:ObjectId,
        required:true
    },
    images:[{
        type:document,
        required:true
    }],
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
        return await db.collection("datasets").find({ project_id: new ObjectId(id) }).toArray();
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