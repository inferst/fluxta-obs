import { StandaloneAction, type StandaloneTriggerContext } from "@fluxta/sdk/api";
import type { SetInputVolumeSettings } from "obs-protocol";

import type { ConnectionsService } from "../connections/service";
import { resolveObs } from "../connections/resolve";
import { setInputVolumePercent } from "../obs/inputs";
import { templatedNumber } from "./templated";

export const SET_INPUT_VOLUME_ACTION = "set-input-volume";

export class SetInputVolumeAction extends StandaloneAction<SetInputVolumeSettings> {
  type = SET_INPUT_VOLUME_ACTION;

  constructor(private readonly connections: ConnectionsService) {
    super();
  }

  onTrigger = async (ctx: StandaloneTriggerContext<SetInputVolumeSettings>): Promise<void> => {
    const input = ctx.settings.input?.trim();
    const percent = templatedNumber(ctx.settings.volumePercent);

    if (!input || percent === undefined) {
      console.warn("Set Input Volume ran with no Input/volume configured");
      return;
    }

    // The editor can no longer refuse a minus sign once the value may come
    // from a Run Variable, so the floor is enforced here instead.
    if (percent < 0) {
      console.warn(`Set Input Volume ignored the volume ${percent}%: it cannot be negative`);
      return;
    }

    const obs = resolveObs(this.connections, ctx.settings);

    if (!obs) {
      console.warn("Set Input Volume ran with no matching Connection configured");
      return;
    }

    try {
      await setInputVolumePercent(obs, input, percent);
    } catch (error) {
      console.warn(`Set Input Volume could not update "${input}":`, error);
    }
  };
}
