import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: [true, 'Username is required'],
            lowercase: true,
            unique: true,
            index: true,
        },
        email:{
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            unique: true
        },
        fullName:{
            type: String,
            required: [true, 'FullName is required'],
            index: true,
        },
        avatar:{
            type: String,
            required: [true, 'Avatar is required'],
        },
        coverImage:{
            type: String,
        },
        password:{
            type: String,
            required: [true, 'Password is required'],
        },
        watchHistory:[
            {
            type: Schema.Types.ObjectId,
            ref: 'Video'
            }
        ],
        refreshToken:{
            type: String,
        }

    },
    {
        timestamps: true,
    }
)

userSchema.pre('save',async function(next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordValid = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    try{
      return jwt.sign(
        {
          _id:this._id,
          username:this.username,
          email:this.email,
          fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
      )
    }
    catch (error) {
      console.error('user.model.js :: generateAccessToken :: Error :',error);
    }

}
userSchema.methods.generateRefreshToken = function() {
  try{
    return jwt.sign(
      {
        _id:this._id,
        username:this.username,
        email:this.email,
        fullName:this.fullName,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    )
  }
  catch (error) {
    console.error('user.model.js :: generateRefreshToken :: Error :',error);
  }
}

export const User = mongoose.model('User', userSchema);