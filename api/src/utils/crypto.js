import bcrypt from "bcrypt";
const saltRound = 10;

export const encrypt = async (pass) => {
  try {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);
    return hash;
  } catch (error) {
    throw new Error(`encryption failed ${error.message}`);
  }
};

export const compare = async (pass, hash) => {
  try {
    const result = await bcrypt.compare(pass, hash);
    return result;
  } catch (error) {
    throw new Error(`compare failed ${error.message}`);
  }
};
