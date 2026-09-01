import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from "path";
import rateLimit from 'express-rate-limit';
import { userRoutes } from './app/modules/auth/user.routes';
import errorHandler from './app/middleware/errorHandler';
import { financialRoutes } from './app/modules/financial-Information/financial.routes';
import { medicalRoutes } from './app/modules/medical-Information/medical.routes';
import { socialRoutes } from './app/modules/social-Information/social.routes';
import { homeautoRoutes } from './app/modules/homeAuto-Information/homeauto.routes';
import { ReportRoutes } from './app/modules/report-Information/report.routes';
import { PackageRoutes } from './app/modules/package/package.routes';
import { SubscriptionRoutes } from './app/modules/subscriptions-information/subscriptions.routes';
import { startSubscriptionExpireCron } from './app/modules/subscriptions-information/subscriptionExpire.cron';
import { requestLogger } from './helpers/requestLogger';
import dotenv from "dotenv";
import { ReviewRoutes } from './app/modules/reviews/reviews.routes';
dotenv.config();





const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cors({
  origin: "*"  
}));
// app.use(cors());
app.use(express.json({  limit: '50mb'}));
app.use(helmet());
const limiter = rateLimit({windowMs: 20 * 60 * 1000, max: 100, });
app.use(limiter);
app.use(requestLogger);












//routes

app.use("/api/v1",userRoutes)
app.use("/api/v1",financialRoutes)
app.use("/api/v1",medicalRoutes)
app.use("/api/v1",socialRoutes)
app.use("/api/v1",homeautoRoutes)
app.use("/api/v1",ReportRoutes)
app.use("/api/v1",PackageRoutes)
app.use("/api/v1",SubscriptionRoutes)
app.use("/api/v1",ReviewRoutes)









//error handling middleware
 app.use(errorHandler) 

startSubscriptionExpireCron();


app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Vercel!");
});


app.get("/test-error", (req, res) => {
  throw new Error("This is a test error");
});


export default app;