import { Router } from "express";
const router = Router();
import * as roomEventController from "./roomEvent.controller.js";
import express from "express";

/************ WebHooks ************/

// room_started Event
router.post("/room_started", roomEventController.room_started);

// room_finished Event
router.post("/room_finished", roomEventController.room_finished);

// participant_joined Event
// router.post("/participant_joined", roomEventController.participant_joined);

// participant_left Event
// router.post("/participant_left", roomEventController.participant_left);

// track_published Event
// router.post("/track_published", roomEventController.track_published);

// track_unpublished Event
// router.post("/track_unpublished", roomEventController.track_unpublished);

export default router;
