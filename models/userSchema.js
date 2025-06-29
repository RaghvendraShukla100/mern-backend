import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Email is invalid"],
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },

    age: {
      type: Number,
      min: 13,
      default: null,
    },

    bio: {
      type: String,
      default: "",
    },

    profilePic: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (value) {
          if (this.isModified("password")) {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(
              value
            );
          }
          return true;
        },
        message:
          "Password must contain 1 uppercase, 1 lowercase, 1 number, 1 special character",
      },
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isVerified: {
      type: Boolean,
      default: false,
    },

    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving (schema-level)
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🔐 Compare password during login
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 👤 Virtual for @username display
userSchema.virtual("displayUsername").get(function () {
  return "@" + this.username.charAt(0).toUpperCase() + this.username.slice(1);
});

// 📊 Indexes for performance and search
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ name: "text", username: "text", bio: "text" });

const User = mongoose.model("User", userSchema);
export default User;
