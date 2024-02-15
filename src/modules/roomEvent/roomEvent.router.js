import { Router } from "express";
const router = Router();
import * as roomEventController from "./roomEvent.controller.js";
import express from "express";

/************ WebHooks ************/

// room_started Event
router.post(
  "/room_started",
  express.raw({ type: "application/webhook+json" }),
  roomEventController.room_started
);

// room_finished Event
router.post(
  "/room_finished",
  express.raw({ type: "application/webhook+json" }),
  roomEventController.room_finished
);

// participant_joined Event
router.post(
  "/participant_joined",
  express.raw({ type: "application/webhook+json" }),
  roomEventController.participant_joined
);

// participant_left Event
router.post(
  "/participant_left",
  express.raw({ type: "application/webhook+json" }),
  roomEventController.participant_left
);

// track_published Event
// router.post(
//   "/track_published",
//   express.raw({ type: "application/webhook+json" }),
//   roomEventController.track_published
// );

// track_unpublished Event
// router.post(
//   "/track_unpublished",
//   express.raw({ type: "application/webhook+json" }),
//   roomEventController.track_unpublished
// );

export default router;
