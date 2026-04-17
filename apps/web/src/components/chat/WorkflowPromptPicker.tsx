import { ChevronDownIcon, XIcon } from "lucide-react";
import { memo, useCallback } from "react";
import { cn } from "~/lib/utils";
import {
	DEFAULT_WORKFLOW_PROMPT_ICON,
	WORKFLOW_PROMPT_MAP,
	WORKFLOW_PROMPTS,
	type WorkflowPrompt,
} from "../../workflowPrompts";
import { Button } from "../ui/button";
import {
	Menu,
	MenuSeparator as MenuDivider,
	MenuGroup,
	MenuItem,
	MenuPopup,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from "../ui/menu";

export interface WorkflowPromptPickerProps {
	value: string | null;
	onChange: (id: string | null) => void;
	compact?: boolean;
}

const PROMPT_SECTIONS = [
	{
		label: "Code",
		ids: ["commitSplit", "refactorMaintainability", "bugfixRootCause"],
	},
	{
		label: "Audit",
		ids: ["securityAudit"],
	},
	{
		label: "Infra",
		ids: ["dependencyUpgrade", "buildPerformance", "runtimePerformance"],
	},
	{
		label: "Docs",
		ids: ["markdownSync"],
	},
] as const;

export const WorkflowPromptPicker = memo(function WorkflowPromptPicker({
	value,
	onChange,
	compact,
}: WorkflowPromptPickerProps) {
	const selected = value ? WORKFLOW_PROMPT_MAP[value] : null;
	const SelectedIcon = selected?.icon ?? DEFAULT_WORKFLOW_PROMPT_ICON;

	const handleValueChange = useCallback(
		(nextValue: string) => {
			if (nextValue === "__none__") {
				onChange(null);
			} else {
				onChange(nextValue);
			}
		},
		[onChange],
	);

	return (
		<Menu>
			<MenuTrigger
				render={(props) => (
					<Button
						{...props}
						size="sm"
						variant="ghost"
						className={cn(
							"min-w-0 justify-start overflow-hidden whitespace-nowrap px-2 text-muted-foreground/70 hover:text-foreground/80 [&_svg]:mx-0",
							selected && "text-foreground/90",
							compact && "max-w-28",
						)}
					>
						<SelectedIcon className="mr-1 size-3.5 shrink-0" />
						<span className="truncate">
							{selected ? selected.shortLabel : "Workflow"}
						</span>
						<ChevronDownIcon className="ml-0.5 size-3 shrink-0 opacity-60" />
					</Button>
				)}
			/>
			<MenuPopup>
				<MenuRadioGroup
					value={value ?? "__none__"}
					onValueChange={handleValueChange}
				>
					<MenuRadioItem value="__none__">None</MenuRadioItem>
				</MenuRadioGroup>
				{PROMPT_SECTIONS.map((section, sectionIndex) => (
					<div key={section.label}>
						<MenuDivider />
						<MenuGroup>
							<div className="px-2 pt-1.5 pb-1 font-medium text-muted-foreground text-xs">
								{section.label}
							</div>
							<MenuRadioGroup
								value={value ?? ""}
								onValueChange={handleValueChange}
							>
								{section.ids.map((id) => {
									const prompt = WORKFLOW_PROMPT_MAP[id];
									if (!prompt) return null;
									return (
										<PromptItem
											key={id}
											prompt={prompt}
											compact={compact ?? false}
										/>
									);
								})}
							</MenuRadioGroup>
						</MenuGroup>
					</div>
				))}
			</MenuPopup>
		</Menu>
	);
});

const PromptItem = memo(function PromptItem({
	prompt,
	compact = false,
}: {
	prompt: WorkflowPrompt;
	compact?: boolean;
}) {
	const Icon = prompt.icon;
	return (
		<MenuRadioItem value={prompt.id}>
			<div className="flex items-center gap-2">
				<Icon className="size-3.5 shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-0.5">
					<span className="text-sm">{prompt.label}</span>
					{!compact && (
						<span className="text-muted-foreground text-xs">
							{prompt.description}
						</span>
					)}
				</div>
			</div>
		</MenuRadioItem>
	);
});
