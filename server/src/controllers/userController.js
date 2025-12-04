// Mock data for now. Connect to DB in config/db.js
exports.getAllUsers = (req, res) => {
  const users = [
    { id: 1, name: 'User1 (Express)', created_at: new Date() },
    { id: 2, name: 'User2 (Express)', created_at: new Date() }
  ];
  res.json({ users });
};

exports.addUser = (req, res) => {
  const { name } = req.body;
  // Logic to add user to DB would go here
  res.json({ message: 'User added successfully', user: { name } });
};
