const verifyInternalKey = (req, res, next) => {
    const internalKey = req.headers['x-server-secret'];
    if (!internalKey || internalKey !== process.env.INTERNAL_SERVER_SECRET) {
        console.error("Internal server access only!");
        return res.status(403).json({ message: "Internal server access only!" });
    }
    next();
};

module.exports = verifyInternalKey;