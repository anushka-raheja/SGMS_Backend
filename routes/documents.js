const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/multerConfig');
const Document = require('../models/document');
const Group = require('../models/group');

router.post('/:groupId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const document = new Document({
      groupId: req.params.groupId,
      uploaderId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    await document.save();
    res.json({ message: 'Document uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// router.get('/:groupId/documents', auth, async (req, res) => {
//     try {
//       const group = await Group.findById(req.params.groupId);
      
//       if (!group) {
//         return res.status(404).json({ error: 'Group not found' });
//       }
      
//       if (!group.members.includes(req.user.id)) {
//         return res.status(403).json({ error: 'You are not a member of this group' });
//       }
  
//       const documents = await Document.find({ groupId: req.params.groupId })

//         .populate('uploaderId', 'name');
//       if (!documents || documents.length === 0) {
//       return res.json([]);
//         }
//       res.json(documents);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       res.status(500).json({ error: 'Failed to fetch documents' });
//     }
//   });

router.get('/:groupId/documents', auth, async (req, res) => {
    try {
      console.log("Fetching documents for group:", req.params.groupId);
  
      const group = await Group.findById(req.params.groupId);
      
      if (!group) {
        console.log("Group not found");
        return res.status(404).json({ error: 'Group not found' });
      }
  
      console.log("Group found:", group);
  
      if (!group.members.includes(req.user.id)) {
        console.log("User is not a member");
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
  
      console.log("User is a member, fetching documents...");
  
      const documents = await Document.find({ groupId: req.params.groupId })
        .populate('uploaderId', 'name');
  
      console.log("Fetched documents:", documents);
  
      if (!documents || documents.length === 0) {
        return res.json([]);
      }
  
      res.json(documents);
    } catch (err) {
        // console.error('Fetch error:', err);
      console.error('Fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch documents', details: err.message });
    }
  });
  
  
module.exports = router;
