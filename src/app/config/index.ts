import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,   
  db_uri: process.env.MongoDB_URI,
  jwt_secret: process.env.JWT_SECRET,
  stripe_secret_key:process.env.STRIPE_SECRET_KEY,
  //copy
   frontend_url: process.env.FONTEND_URL,
   backend_url: process.env.BACKEND_URL,
  //copy 
     stripe: {
          stripe_secret_key: process.env.STRIPE_SECRET_KYE,
          paymentSuccess_url: process.env.STRIPE_PAYMENT_SUCCESS_URL,
          stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
          stripe_webhook_url: process.env.STRIPE_WEBHOOK_URL,
          stripe_product_id: process.env.STRIPE_PRODUCT_ID,
     },
       // ✅ email config এখানে add করো
  email: {
    header_name: process.env.EMAIL_HEADER_NAME,
    from: process.env.EMAIL_FROM,
    domain: process.env.EMAIL_DOMAIN,
    api_key: process.env.EMAIL_API_KEY,
  },

 
};

//mongodb+srv://rkrafikridoy5887_db_user:ooVS91rbk62V05ZN@arron-backend-project.fodvybr.mongodb.net/?appName=arron-backend-project