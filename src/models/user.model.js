import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 

const userSchema = new Schema(
  {
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,// to make it searching in that field optimized
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,// cloudinary url
        required: true,
    },
    coverImage: {
        type: String,//cloudinary url
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    }],
    password: {
        type: String,
        required: [true,'Password is required'],
    },
    refreshToken: {
        type: String,
    },
  },{
    timestamps: true,
}); 

// Runs automatically BEFORE saving a user document in MongoDB
userSchema.pre("save", async function (next) {

  // If password is NOT changed  then skip hashing and continue saving normally
  if (!this.isModified("password")) return next();

  // If password is changed or user is new, hash the plain password before saving
  this.password = await bcrypt.hash(this.password, 10);

  // Continue the save operation
  next();
});


// Custom instance method for checking password during login
userSchema.methods.isPasswordCorrect = async function (password) {

  // Compare entered password (plain text) with stored hashed password
  // bcrypt.compare() returns true/false
  return await bcrypt.compare(password, this.password);
};


// Instance method: generates a short-lived JWT Access Token
// This token is used for authenticating API requests (protected routes)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      // Payload (data stored inside the token)
      // You can access this later using jwt.verify()
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },

    // Secret key used to sign the token (must be kept private)
    process.env.ACCESS_TOKEN_SECRET,

    {
      // Token expiry time (example: "15m", "1h", "7d")
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  )
}


export const User = mongoose.model("User", userSchema);