"use client";

import { useState } from "react";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useEdpexCatalog,
  useCreateEdpexTopic,
  useUpdateEdpexTopic,
  useDeleteEdpexTopic,
  useCreateEdpexArea,
  useUpdateEdpexArea,
  useDeleteEdpexArea,
} from "@/lib/data/hooks";
import type { EdpexArea, EdpexTopic } from "@/lib/types";
import { EDPEX_AREA_CODE_MAX, EDPEX_TOPIC_ID_MAX, edpexAreaId } from "@/lib/kpi/edpex";

type Editing =
  | { kind: "newTopic" }
  | { kind: "topic"; topic: EdpexTopic }
  | { kind: "newArea"; topic: EdpexTopic }
  | { kind: "area"; area: EdpexArea }
  | null;

export default function EdpexPage() {
  return (
    <RequirePermission action="configure_kpis">
      <EdpexManager />
    </RequirePermission>
  );
}

function EdpexManager() {
  const catalog = useEdpexCatalog();
  const createTopic = useCreateEdpexTopic();
  const updateTopic = useUpdateEdpexTopic();
  const deleteTopic = useDeleteEdpexTopic();
  const createArea = useCreateEdpexArea();
  const updateArea = useUpdateEdpexArea();
  const deleteArea = useDeleteEdpexArea();
  const confirm = useConfirm();

  const [editing, setEditing] = useState<Editing>(null);
  const saving =
    createTopic.isPending || updateTopic.isPending || createArea.isPending || updateArea.isPending;
  const busy = saving || deleteTopic.isPending || deleteArea.isPending;
  const topics = catalog.data ?? [];

  const saveError = [createTopic, updateTopic, createArea, updateArea]
    .map((m) => (m.error instanceof Error ? m.error.message : null))
    .find(Boolean);

  const close = () => {
    for (const m of [createTopic, updateTopic, createArea, updateArea]) m.reset();
    setEditing(null);
  };

  const iconButton = "text-mute p-xs rounded hover:bg-surface-soft disabled:opacity-50";

  return (
    <>
      <PageHeader
        title="EdPEx Topics & Areas"
        description="The EdPEx Category 7 results items (topics) and the areas within each. KPIs pick a topic, then one of its areas."
        actions={
          <Button icon="add" disabled={busy} onClick={() => setEditing({ kind: "newTopic" })}>
            Add Topic
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={catalog.isLoading} isError={catalog.isError}>
          {topics.length === 0 ? (
            <EmptyState
              icon="workspace_premium"
              title="No EdPEx topics"
              message="Add the first EdPEx topic, e.g. 7.1."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th align="right">Order</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <TopicRows
                    key={topic.id}
                    topic={topic}
                    busy={busy}
                    iconButton={iconButton}
                    onEditTopic={() => setEditing({ kind: "topic", topic })}
                    onAddArea={() => setEditing({ kind: "newArea", topic })}
                    onEditArea={(area) => setEditing({ kind: "area", area })}
                    onDeleteTopic={async () => {
                      const ok = await confirm({
                        title: "Delete EdPEx topic",
                        message:
                          topic.areas.length > 0
                            ? `Delete topic ${topic.id} and its ${topic.areas.length} area(s)? This is refused while any KPI uses them.`
                            : `Delete topic ${topic.id}? This is refused while any KPI uses it.`,
                        confirmLabel: "Delete",
                      });
                      if (ok) deleteTopic.mutate(topic.id);
                    }}
                    onDeleteArea={async (area) => {
                      const ok = await confirm({
                        title: "Delete EdPEx area",
                        message: `Delete area ${area.id}? This is refused while any KPI uses it.`,
                        confirmLabel: "Delete",
                      });
                      if (ok) deleteArea.mutate(area.id);
                    }}
                  />
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      {editing && (
        <EdpexModal
          editing={editing}
          submitting={saving}
          error={saveError ?? undefined}
          onClose={close}
          onSave={({ code, name, sortOrder }) => {
            const done = { onSuccess: close };
            if (editing.kind === "newTopic") createTopic.mutate({ id: code, name }, done);
            else if (editing.kind === "topic")
              updateTopic.mutate({ id: editing.topic.id, patch: { name, sortOrder } }, done);
            else if (editing.kind === "newArea")
              createArea.mutate({ topicId: editing.topic.id, code, name }, done);
            else updateArea.mutate({ id: editing.area.id, patch: { name, sortOrder } }, done);
          }}
        />
      )}
    </>
  );
}

function TopicRows({
  topic,
  busy,
  iconButton,
  onEditTopic,
  onAddArea,
  onDeleteTopic,
  onEditArea,
  onDeleteArea,
}: {
  topic: EdpexTopic;
  busy: boolean;
  iconButton: string;
  onEditTopic: () => void;
  onAddArea: () => void;
  onDeleteTopic: () => void;
  onEditArea: (area: EdpexArea) => void;
  onDeleteArea: (area: EdpexArea) => void;
}) {
  return (
    <>
      <Tr className="bg-surface-soft/60">
        <Td className="font-semibold whitespace-nowrap">{topic.id}</Td>
        <Td className="font-semibold">{topic.name}</Td>
        <Td align="right" className="text-mute">
          {topic.sortOrder}
        </Td>
        <Td align="right">
          <div className="flex items-center justify-end gap-xs">
            <button
              aria-label={`Add area to ${topic.id}`}
              title="Add area"
              disabled={busy}
              className={`${iconButton} hover:text-on-surface`}
              onClick={onAddArea}
            >
              <Icon name="add" size={18} />
            </button>
            <button
              aria-label={`Edit topic ${topic.id}`}
              title="Edit topic"
              disabled={busy}
              className={`${iconButton} hover:text-on-surface`}
              onClick={onEditTopic}
            >
              <Icon name="edit" size={18} />
            </button>
            <button
              aria-label={`Delete topic ${topic.id}`}
              title="Delete topic"
              disabled={busy}
              className={`${iconButton} hover:text-error`}
              onClick={onDeleteTopic}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        </Td>
      </Tr>
      {topic.areas.map((area) => (
        <Tr key={area.id}>
          <Td className="pl-xl whitespace-nowrap">{area.id}</Td>
          <Td className="pl-xl">{area.name}</Td>
          <Td align="right" className="text-mute">
            {area.sortOrder}
          </Td>
          <Td align="right">
            <div className="flex items-center justify-end gap-xs">
              <button
                aria-label={`Edit area ${area.id}`}
                title="Edit area"
                disabled={busy}
                className={`${iconButton} hover:text-on-surface`}
                onClick={() => onEditArea(area)}
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                aria-label={`Delete area ${area.id}`}
                title="Delete area"
                disabled={busy}
                className={`${iconButton} hover:text-error`}
                onClick={() => onDeleteArea(area)}
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          </Td>
        </Tr>
      ))}
      {topic.areas.length === 0 && (
        <Tr>
          <td colSpan={4} className="border-b border-hairline px-lg py-sm pl-xl text-mute">
            No areas yet — KPIs under {topic.id} can only pick the topic.
          </td>
        </Tr>
      )}
    </>
  );
}

function EdpexModal({
  editing,
  submitting,
  error,
  onClose,
  onSave,
}: {
  editing: NonNullable<Editing>;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onSave: (v: { code: string; name: string; sortOrder?: number }) => void;
}) {
  const isNew = editing.kind === "newTopic" || editing.kind === "newArea";
  const isArea = editing.kind === "newArea" || editing.kind === "area";
  const existing =
    editing.kind === "topic" ? editing.topic : editing.kind === "area" ? editing.area : null;

  const [code, setCode] = useState(
    editing.kind === "topic" ? editing.topic.id : editing.kind === "area" ? editing.area.code : "",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? ""));

  const parentTopic = editing.kind === "newArea" ? editing.topic.id : null;
  const codeValid = code.trim().length > 0 && !/\s/.test(code.trim());
  const orderValid = isNew || /^-?\d+$/.test(sortOrder.trim());
  const valid = codeValid && name.trim().length > 0 && orderValid;

  const title = isNew
    ? isArea
      ? `Add Area to ${parentTopic}`
      : "Add EdPEx Topic"
    : isArea
      ? `Edit Area ${(existing as EdpexArea).id}`
      : `Edit Topic ${(existing as EdpexTopic).id}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={
        isNew
          ? "The code is what KPIs and CSV files refer to, and cannot be changed later."
          : "The code is fixed; the name and order can be changed."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onSave({
                code: code.trim(),
                name: name.trim(),
                sortOrder: isNew ? undefined : Number(sortOrder.trim()),
              })
            }
          >
            {submitting ? "Saving…" : isNew ? "Add" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        {error && (
          <div className="rounded border border-error/30 bg-error/10 px-md py-sm text-body-sm text-error">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field
            label={isArea ? "Area code" : "Topic code"}
            hint={
              isArea && parentTopic && code.trim()
                ? `Area id: ${edpexAreaId(parentTopic, code.trim())}`
                : isArea
                  ? "e.g. ก"
                  : "e.g. 7.1"
            }
          >
            <Input
              value={code}
              disabled={!isNew}
              maxLength={isArea ? EDPEX_AREA_CODE_MAX : EDPEX_TOPIC_ID_MAX}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isArea ? "ก" : "7.1"}
            />
          </Field>
          {!isNew && (
            <Field label="Order" hint="Lower numbers are listed first">
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isArea ? "เช่น ผลลัพธ์ด้านประสิทธิผลของกระบวนการทำงาน" : "เช่น ผลลัพธ์ด้านลูกค้า"}
          />
        </Field>
      </div>
    </Modal>
  );
}
