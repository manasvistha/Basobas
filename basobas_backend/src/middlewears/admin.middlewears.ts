export const requireAdmin = (req: any, res: any, next: any) => {
  try {
    const user = req.user;

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to authorize admin",
    });
  }
};
