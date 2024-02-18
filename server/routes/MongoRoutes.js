const router = require('express').Router();
const { getDocuments, getDocumentData, createDocument, editDocument, deleteDocument} = require('../controllers/mongoController')
const fetchuser = require('./middleware/FetchUser')


router.get("/documents/get", getDocuments );
router.get("/documents/data/get/:documentName", getDocumentData );

router.post("/documents/data/create", createDocument );
router.put("/documents/data/editt", editDocument );
router.delete("/documents/data/delete", deleteDocument );

module.exports = router;
