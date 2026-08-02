import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri as string, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB Atlas Connected successfully.');
  } catch (error) {
    console.error('MongoDB Connection Failed. Falling back to in-memory/mock persistence mode.', error);
  }
}
