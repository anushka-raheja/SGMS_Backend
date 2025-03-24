const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/group');

// Create new group
router.post('/', auth, async (req, res) => {
    
  try {
    // Validate required fields
    if (!req.body.name || !req.body.subject) {
      return res.status(400).json({ error: 'Name and subject are required' });
    }

    const group = new Group({
      name: req.body.name,
      description: req.body.description,
      subject: req.body.subject,
      isPublic: req.body.isPublic,
      admins: [req.user.id],  // Current user becomes admin
      members: [req.user.id]  // Current user becomes first member
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error('Group creation error:', err);
    res.status(500).json({ error: 'Server error during group creation' });
  }
});

// Get groups where current user is a member
router.get('/my-groups', auth, async (req, res) => {
    try {
      const groups = await Group.find({ members: req.user.id })
        .populate('members', 'name')
        .populate('admins', 'name');
        
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });  
router.get('/list', auth, async (req, res) => {
    try {
        const groups = await Group.find()
        .populate('members', 'name')
        .populate('admins', 'name');
        
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}); 
router.get('/test', (req, res) => {
    res.json({ message: "Route working!" });
  });

  router.post('/:id/join', auth, async (req, res) => {
    try {
      // 1. Get group and verify existence
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      // 2. Verify group is public
      if (!group.isPublic) {
        return res.status(403).json({ error: 'Private group - request invitation' });
      }
  
      // 3. Check existing membership
      if (group.members.includes(req.user.id)) {
        return res.status(400).json({ error: 'Already a member' });
      }
  
      // 4. Add user to members
      const updatedGroup = await Group.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { members: req.user.id } },  // Prevents duplicates
        { new: true, runValidators: true }
      ).populate('members', 'name email')
       .populate('admins', 'name');
  
      res.json(updatedGroup);
  
    } catch (err) {
      console.error('Join error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });


  router.post('/:id/request', auth, async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      
      if (group.isPublic) {
        return res.status(400).json({ error: 'Join directly for public groups' });
      }
      
      if (group.joinRequests.includes(req.user.id)) {
        return res.status(400).json({ error: 'Request already pending' });
      }
  
      group.joinRequests.push(req.user.id);
      await group.save();
      res.json({ message: 'Join request sent to admin' });
      
    } catch (err) {
      res.status(500).json({ error: 'Request failed' });
    }
  });
  
  // Get pending requests for admin
  router.get('/admin/requests', auth, async (req, res) => {
    try {
      const requests = await Group.find({
        admins: req.user.id,
        joinRequests: { $exists: true, $ne: [] }
      }).populate('joinRequests', 'name email');
      
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });
  
  // Approve join request
  router.post('/:groupId/approve/:userId', auth, async (req, res) => {
    try {
      const group = await Group.findById(req.params.groupId);
      
      if (!group.admins.includes(req.user.id)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
  
      await Group.findByIdAndUpdate(
        req.params.groupId,
        {
          $addToSet: { members: req.params.userId },
          $pull: { joinRequests: req.params.userId }
        },
        { new: true }
      );
  
      res.json({ message: 'User added to group' });
      
    } catch (err) {
      res.status(500).json({ error: 'Approval failed' });
    }
  });

  router.get('/:groupId', auth, async (req, res) => {
    try {
      const group = await Group.findById(req.params.groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      if (!group.members.includes(req.user.id)) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
  
      res.json(group);
    } catch (err) {
      console.error('Fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  });
  
  


module.exports = router;
