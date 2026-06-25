const authService = require('../services/auth.service');

const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const newUser = await authService.registerUser(username, password);
        return res.status(201).json({ 
            message: "User registered successfully", 
            user: newUser 
        });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({ message: error.message });
        }
        console.error("Register error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const authData = await authService.loginUser(username, password);
        return res.status(200).json(authData);

    } catch (error) {
        if (error.message === 'Invalid username or password') {
            return res.status(401).json({ message: error.message });
        }
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    register,
    login
};
