import { EditorPage, TemplateField, useActionSettings } from "@fluxta/sdk/ui";
import type { SetInputVolumeSettings } from "obs-protocol";

import { ConnectionSelect } from "../shared/ConnectionSelect";
import { effectiveConnectionId } from "../shared/effectiveConnectionId";
import { PickerSelect } from "../shared/PickerSelect";
import { useEditorConnections } from "../shared/useEditorConnections";
import { useInputs } from "../shared/useLiveLists";

export function SetInputVolumeEditor() {
  const { values, set } = useActionSettings<SetInputVolumeSettings>();
  const connections = useEditorConnections();
  const inputs = useInputs(effectiveConnectionId(connections, values.connection));

  return (
    <EditorPage>
      <ConnectionSelect connections={connections} value={values.connection} onChange={set("connection")} />
      <PickerSelect
        label="Input"
        placeholder="Choose an Input"
        options={inputs}
        value={values.input}
        onChange={set("input")}
      />
      <TemplateField
        label="Volume"
        // Actions saved before this field took templates hold a plain number.
        value={String(values.volumePercent ?? "")}
        onChange={set("volumePercent")}
        placeholder="100"
        hint="Percent — matches what OBS's own mixer shows. 100 is unity gain; OBS allows boosting past it."
      />
    </EditorPage>
  );
}
