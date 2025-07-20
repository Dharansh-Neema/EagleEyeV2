const { 
    createDataset, 
    findDatasetById, 
    findDatasetByProjectId, 
    findDatasetByOrganizationId,
    updateDataset, 
    deleteDataset,
    addImageToDataset,
    removeImageFromDataset,
    getDatasetCountByProject
} = require("../models/datasetModel");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const organizationModel = require("../models/organizationModel");

// Create Dataset - Admin only
const createDatasetMethod = async (req, res) => {
    try {
        const { name, projectId, images } = req.body;
        
        if (!name || !projectId) {
            return res.status(400).json({
                success: false,
                message: "Name and projectId are required"
            });
        }

        const db = getDB();
        const datasetData = {
            name,
            projectId: new ObjectId(projectId),
            images: images || []
        };

        const result = await createDataset(db, datasetData);
        return res.status(201).json({ 
            success: true, 
            message: "Dataset created successfully",
            data: result 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Get Dataset by ID
const getDatasetById = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dataset ID"
            });
        }

        const db = getDB();
        const dataset = await findDatasetById(db, id);
        
        if (!dataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });
        }

        // Authorization check for non-admin users
        if (req.user.role !== "admin") {
            const userOrgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
            const userOrgIds = userOrgs.map(org => org._id.toString());
            
            if (!userOrgIds.includes(dataset.organization_id.toString())) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to access this dataset"
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: dataset
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Datasets by Project ID
const getDatasetsByProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID"
            });
        }

        const db = getDB();
        const datasets = await findDatasetByProjectId(db, projectId);

        // Authorization check for non-admin users
        if (req.user.role !== "admin" && datasets.length > 0) {
            const userOrgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
            const userOrgIds = userOrgs.map(org => org._id.toString());
            
            // Filter datasets based on user's organizations
            const authorizedDatasets = datasets.filter(dataset => 
                userOrgIds.includes(dataset.organization_id.toString())
            );
            
            return res.status(200).json({
                success: true,
                count: authorizedDatasets.length,
                data: authorizedDatasets
            });
        }

        return res.status(200).json({
            success: true,
            count: datasets.length,
            data: datasets
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Dataset - Admin only
const updateDatasetMethod = async (req, res) => {
    try {
        const { id } = req.body;
        const updateData = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dataset ID"
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.organization_id;
        delete updateData.created_at;
        
        // Add updated timestamp
        updateData.updated_at = new Date();

        const db = getDB();
        
        // Check if dataset exists
        const existingDataset = await findDatasetById(db, id);
        if (!existingDataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });
        }

        const result = await updateDataset(db, id, updateData);
        
        return res.status(200).json({
            success: true,
            message: "Dataset updated successfully",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Dataset - Admin only
const deleteDatasetMethod = async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dataset ID"
            });
        }

        const db = getDB();
        
        // Check if dataset exists
        const existingDataset = await findDatasetById(db, id);
        if (!existingDataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });
        }

        const result = await deleteDataset(db, id);
        
        if (result) {
            return res.status(200).json({
                success: true,
                message: "Dataset deleted successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to delete dataset"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get User's Datasets (based on organizations)
const getUserDatasets = async (req, res) => {
    try {
        const db = getDB();
        
        if (req.user.role === "admin") {
            // Admin can see all datasets
            const datasets = await db.collection("datasets").find({}).toArray();
            return res.status(200).json({
                success: true,
                count: datasets.length,
                data: datasets
            });
        } else {
            // Regular users can only see datasets from their organizations
            const userOrgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
            const userOrgIds = userOrgs.map(org => org._id);
            
            const datasets = await db.collection("datasets")
                .find({ organization_id: { $in: userOrgIds } })
                .toArray();
            
            return res.status(200).json({
                success: true,
                count: datasets.length,
                data: datasets
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add Image to Dataset - Admin only
const addImageToDatasetMethod = async (req, res) => {
    try {
        const { id, imageData } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dataset ID"
            });
        }

        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: "Image data is required"
            });
        }

        const db = getDB();
        
        // Check if dataset exists
        const existingDataset = await findDatasetById(db, id);
        if (!existingDataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });
        }

        const result = await addImageToDataset(db, id, imageData);
        
        if (result) {
            return res.status(200).json({
                success: true,
                message: "Image added to dataset successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to add image to dataset"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Remove Image from Dataset - Admin only
const removeImageFromDatasetMethod = async (req, res) => {
    try {
        const { id, imageId } = req.body;
        
        if (!ObjectId.isValid(id) || !ObjectId.isValid(imageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid dataset ID or image ID"
            });
        }

        const db = getDB();
        
        // Check if dataset exists
        const existingDataset = await findDatasetById(db, id);
        if (!existingDataset) {
            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });
        }

        const result = await removeImageFromDataset(db, id, imageId);
        
        if (result) {
            return res.status(200).json({
                success: true,
                message: "Image removed from dataset successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to remove image from dataset"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Dataset Statistics
const getDatasetStats = async (req, res) => {
    try {
        const db = getDB();
        
        let stats = {};
        
        if (req.user.role === "admin") {
            // Admin can see all statistics
            const totalDatasets = await db.collection("datasets").countDocuments({});
            const totalImages = await db.collection("datasets").aggregate([
                { $unwind: "$images" },
                { $count: "total" }
            ]).toArray();
            
            stats = {
                totalDatasets,
                totalImages: totalImages.length > 0 ? totalImages[0].total : 0
            };
        } else {
            // Regular users can only see stats from their organizations
            const userOrgs = await organizationModel.findOrganizationsByUserId(db, req.user._id);
            const userOrgIds = userOrgs.map(org => org._id);
            
            const totalDatasets = await db.collection("datasets")
                .countDocuments({ organization_id: { $in: userOrgIds } });
            
            const totalImages = await db.collection("datasets").aggregate([
                { $match: { organization_id: { $in: userOrgIds } } },
                { $unwind: "$images" },
                { $count: "total" }
            ]).toArray();
            
            stats = {
                totalDatasets,
                totalImages: totalImages.length > 0 ? totalImages[0].total : 0
            };
        }
        
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Datasets by Organization - Admin only
const getDatasetsByOrganization = async (req, res) => {
    try {
        const { organization_id } = req.body;
        
        if (!ObjectId.isValid(organization_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid organization ID"
            });
        }

        const db = getDB();
        const datasets = await findDatasetByOrganizationId(db, organization_id);

        return res.status(200).json({
            success: true,
            count: datasets.length,
            data: datasets
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createDatasetMethod,
    getDatasetById,
    getDatasetsByProject,
    getDatasetsByOrganization,
    updateDatasetMethod,
    deleteDatasetMethod,
    getUserDatasets,
    addImageToDatasetMethod,
    removeImageFromDatasetMethod,
    getDatasetStats
};
