/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/panelpart.css';
import { localize, localize2 } from '../../../../nls.js';
import { KeyMod, KeyCode } from '../../../../base/common/keyCodes.js';
import { MenuId, MenuRegistry, registerAction2, Action2, IAction2Options } from '../../../../platform/actions/common/actions.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { ActivityBarPosition, isHorizontal, IWorkbenchLayoutService, LayoutSettings, PanelAlignment, Parts, Position, positionToString } from '../../../services/layout/browser/layoutService.js';
import { AuxiliaryBarVisibleContext, PanelAlignmentContext, PanelMaximizedContext, PanelPositionContext, PanelVisibleContext } from '../../../common/contextkeys.js';
import { ContextKeyExpr, ContextKeyExpression } from '../../../../platform/contextkey/common/contextkey.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { ViewContainerLocationToString, ViewContainerLocation, IViewDescriptorService } from '../../../common/views.js';
import { PearAIChatExtensionId, PearAISearchExtensionId, PearAIMemoryExtensionId, PearAIRooExtensionId, PearAIView, PEARAI_VIEWS} from '../../../services/views/pearai/pearaiViewsShared.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { IPaneCompositePartService } from '../../../services/panecomposite/browser/panecomposite.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { ICommandActionTitle } from '../../../../platform/action/common/action.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { SwitchCompositeViewAction } from '../compositeBarActions.js';

const maximizeIcon = registerIcon('panel-maximize', Codicon.chevronUp, localize('maximizeIcon', 'Icon to maximize a panel.'));
const restoreIcon = registerIcon('panel-restore', Codicon.chevronDown, localize('restoreIcon', 'Icon to restore a panel.'));
const closeIcon = registerIcon('panel-close', Codicon.close, localize('closeIcon', 'Icon to close a panel.'));
const panelIcon = registerIcon('panel-layout-icon', Codicon.layoutPanel, localize('togglePanelOffIcon', 'Icon to toggle the panel off when it is on.'));
const panelOffIcon = registerIcon('panel-layout-icon-off', Codicon.layoutPanelOff, localize('togglePanelOnIcon', 'Icon to toggle the panel on when it is off.'));

export class SwitchToPearAIIntegrationAction extends Action2 {
  static readonly ID = 'workbench.action.switchToPearAIIntegrationIconBar';

  constructor() {
    super({
      id: SwitchToPearAIIntegrationAction.ID,
    title: localize2('switchToPearAIView', "Switch to PearAI Integration"),
    category: Categories.View,
    f1: true
    });
  }

  override async run(accessor: ServicesAccessor, args?: { view: PearAIView }): Promise<void> {
    const view = args?.view || 'chat'; // default to chat if no view specified
    const viewsService = accessor.get(IViewsService);
    const layoutService = accessor.get(IWorkbenchLayoutService);

    if (!layoutService.isVisible(Parts.AUXILIARYBAR_PART)) {
    layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
    }

    await viewsService.openView(PEARAI_VIEWS[view], true);
  }
}

export class TogglePanelAction extends Action2 {

	static readonly ID = 'workbench.action.togglePanel';
	static readonly LABEL = localize2('togglePanelVisibility', "Toggle Panel Visibility");

	constructor() {
		super({
			id: TogglePanelAction.ID,
			title: TogglePanelAction.LABEL,
			toggled: {
				condition: PanelVisibleContext,
				title: localize('toggle panel', "Panel"),
				mnemonicTitle: localize({ key: 'toggle panel mnemonic', comment: ['&& denotes a mnemonic'] }, "&&Panel"),
			},
			f1: true,
			category: Categories.View,
			keybinding: { primary: KeyMod.CtrlCmd | KeyCode.KeyJ, weight: KeybindingWeight.WorkbenchContrib },
			menu: [
				{
					id: MenuId.MenubarAppearanceMenu,
					group: '2_workbench_layout',
					order: 5
				}, {
					id: MenuId.LayoutControlMenuSubmenu,
					group: '0_workbench_layout',
					order: 4
				},
			]
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		const layoutService = accessor.get(IWorkbenchLayoutService);
		layoutService.setPartHidden(layoutService.isVisible(Parts.PANEL_PART), Parts.PANEL_PART);
	}
}

registerAction2(TogglePanelAction);

registerAction2(class extends Action2 {

	static readonly ID = 'workbench.action.focusPanel';
	static readonly LABEL = localize('focusPanel', "Focus into Panel");

	constructor() {
		super({
			id: 'workbench.action.focusPanel',
			title: localize2('focusPanel', "Focus into Panel"),
			category: Categories.View,
			f1: true,
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const paneCompositeService = accessor.get(IPaneCompositePartService);

		// Show panel
		if (!layoutService.isVisible(Parts.PANEL_PART)) {
			layoutService.setPartHidden(false, Parts.PANEL_PART);
		}

		// Focus into active panel
		const panel = paneCompositeService.getActivePaneComposite(ViewContainerLocation.Panel);
		panel?.focus();
	}
});

const PositionPanelActionId = {
	LEFT: 'workbench.action.positionPanelLeft',
	RIGHT: 'workbench.action.positionPanelRight',
	BOTTOM: 'workbench.action.positionPanelBottom',
	TOP: 'workbench.action.positionPanelTop'
};

const AlignPanelActionId = {
	LEFT: 'workbench.action.alignPanelLeft',
	RIGHT: 'workbench.action.alignPanelRight',
	CENTER: 'workbench.action.alignPanelCenter',
	JUSTIFY: 'workbench.action.alignPanelJustify',
};

interface PanelActionConfig<T> {
	id: string;
	when: ContextKeyExpression;
	title: ICommandActionTitle;
	shortLabel: string;
	value: T;
}

function createPanelActionConfig<T>(id: string, title: ICommandActionTitle, shortLabel: string, value: T, when: ContextKeyExpression): PanelActionConfig<T> {
	return {
		id,
		title,
		shortLabel,
		value,
		when,
	};
}

function createPositionPanelActionConfig(id: string, title: ICommandActionTitle, shortLabel: string, position: Position): PanelActionConfig<Position> {
	return createPanelActionConfig<Position>(id, title, shortLabel, position, PanelPositionContext.notEqualsTo(positionToString(position)));
}

function createAlignmentPanelActionConfig(id: string, title: ICommandActionTitle, shortLabel: string, alignment: PanelAlignment): PanelActionConfig<PanelAlignment> {
	return createPanelActionConfig<PanelAlignment>(id, title, shortLabel, alignment, PanelAlignmentContext.notEqualsTo(alignment));
}


const PositionPanelActionConfigs: PanelActionConfig<Position>[] = [
	createPositionPanelActionConfig(PositionPanelActionId.TOP, localize2('positionPanelTop', "Move Panel To Top"), localize('positionPanelTopShort', "Top"), Position.TOP),
	createPositionPanelActionConfig(PositionPanelActionId.LEFT, localize2('positionPanelLeft', "Move Panel Left"), localize('positionPanelLeftShort', "Left"), Position.LEFT),
	createPositionPanelActionConfig(PositionPanelActionId.RIGHT, localize2('positionPanelRight', "Move Panel Right"), localize('positionPanelRightShort', "Right"), Position.RIGHT),
	createPositionPanelActionConfig(PositionPanelActionId.BOTTOM, localize2('positionPanelBottom', "Move Panel To Bottom"), localize('positionPanelBottomShort', "Bottom"), Position.BOTTOM),
];


const AlignPanelActionConfigs: PanelActionConfig<PanelAlignment>[] = [
	createAlignmentPanelActionConfig(AlignPanelActionId.LEFT, localize2('alignPanelLeft', "Set Panel Alignment to Left"), localize('alignPanelLeftShort', "Left"), 'left'),
	createAlignmentPanelActionConfig(AlignPanelActionId.RIGHT, localize2('alignPanelRight', "Set Panel Alignment to Right"), localize('alignPanelRightShort', "Right"), 'right'),
	createAlignmentPanelActionConfig(AlignPanelActionId.CENTER, localize2('alignPanelCenter', "Set Panel Alignment to Center"), localize('alignPanelCenterShort', "Center"), 'center'),
	createAlignmentPanelActionConfig(AlignPanelActionId.JUSTIFY, localize2('alignPanelJustify', "Set Panel Alignment to Justify"), localize('alignPanelJustifyShort', "Justify"), 'justify'),
];



MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	submenu: MenuId.PanelPositionMenu,
	title: localize('positionPanel', "Panel Position"),
	group: '3_workbench_layout_move',
	order: 4
});

PositionPanelActionConfigs.forEach((positionPanelAction, index) => {
	const { id, title, shortLabel, value, when } = positionPanelAction;

	registerAction2(class extends Action2 {
		constructor() {
			super({
				id,
				title,
				category: Categories.View,
				f1: true
			});
		}
		run(accessor: ServicesAccessor): void {
			const layoutService = accessor.get(IWorkbenchLayoutService);
			layoutService.setPanelPosition(value === undefined ? Position.BOTTOM : value);
		}
	});

	MenuRegistry.appendMenuItem(MenuId.PanelPositionMenu, {
		command: {
			id,
			title: shortLabel,
			toggled: when.negate()
		},
		order: 5 + index
	});
});

MenuRegistry.appendMenuItem(MenuId.MenubarAppearanceMenu, {
	submenu: MenuId.PanelAlignmentMenu,
	title: localize('alignPanel', "Align Panel"),
	group: '3_workbench_layout_move',
	order: 5
});

AlignPanelActionConfigs.forEach(alignPanelAction => {
	const { id, title, shortLabel, value, when } = alignPanelAction;
	registerAction2(class extends Action2 {
		constructor() {
			super({
				id,
				title,
				category: Categories.View,
				toggled: when.negate(),
				f1: true
			});
		}
		run(accessor: ServicesAccessor): void {
			const layoutService = accessor.get(IWorkbenchLayoutService);
			layoutService.setPanelAlignment(value === undefined ? 'center' : value);
		}
	});

	MenuRegistry.appendMenuItem(MenuId.PanelAlignmentMenu, {
		command: {
			id,
			title: shortLabel,
			toggled: when.negate()
		},
		order: 5
	});
});

registerAction2(class extends SwitchCompositeViewAction {
	constructor() {
		super({
			id: 'workbench.action.previousPanelView',
			title: localize2('previousPanelView', "Previous Panel View"),
			category: Categories.View,
			f1: true
		}, ViewContainerLocation.Panel, -1);
	}
});

registerAction2(class extends SwitchCompositeViewAction {
	constructor() {
		super({
			id: 'workbench.action.nextPanelView',
			title: localize2('nextPanelView', "Next Panel View"),
			category: Categories.View,
			f1: true
		}, ViewContainerLocation.Panel, 1);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.toggleMaximizedPanel',
			title: localize2('toggleMaximizedPanel', 'Toggle Maximized Panel'),
			tooltip: localize('maximizePanel', "Maximize Panel Size"),
			category: Categories.View,
			f1: true,
			icon: maximizeIcon, // This is being rotated in CSS depending on the panel position
			// the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
			precondition: ContextKeyExpr.or(PanelAlignmentContext.isEqualTo('center'), ContextKeyExpr.and(PanelPositionContext.notEqualsTo('bottom'), PanelPositionContext.notEqualsTo('top'))),
			toggled: { condition: PanelMaximizedContext, icon: restoreIcon, tooltip: localize('minimizePanel', "Restore Panel Size") },
			menu: [{
				id: MenuId.PanelTitle,
				group: 'navigation',
				order: 1,
				// the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
				when: ContextKeyExpr.or(PanelAlignmentContext.isEqualTo('center'), ContextKeyExpr.and(PanelPositionContext.notEqualsTo('bottom'), PanelPositionContext.notEqualsTo('top')))
			}]
		});
	}
	run(accessor: ServicesAccessor) {
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const notificationService = accessor.get(INotificationService);
		if (layoutService.getPanelAlignment() !== 'center' && isHorizontal(layoutService.getPanelPosition())) {
			notificationService.warn(localize('panelMaxNotSupported', "Maximizing the panel is only supported when it is center aligned."));
			return;
		}

		if (!layoutService.isVisible(Parts.PANEL_PART)) {
			layoutService.setPartHidden(false, Parts.PANEL_PART);
			// If the panel is not already maximized, maximize it
			if (!layoutService.isPanelMaximized()) {
				layoutService.toggleMaximizedPanel();
			}
		}
		else {
			layoutService.toggleMaximizedPanel();
		}
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.closePanel',
			title: localize2('closePanel', 'Hide Panel'),
			category: Categories.View,
			icon: closeIcon,
			menu: [{
				id: MenuId.CommandPalette,
				when: PanelVisibleContext,
			}, {
				id: MenuId.PanelTitle,
				group: 'navigation',
				order: 2
			}]
		});
	}
	run(accessor: ServicesAccessor) {
		accessor.get(IWorkbenchLayoutService).setPartHidden(true, Parts.PANEL_PART);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.closeAuxiliaryBar',
			title: localize2('closeSecondarySideBar', 'Hide PearAI Side Bar'),
			category: Categories.View,
			icon: closeIcon,
			menu: [{
				id: MenuId.CommandPalette,
				when: AuxiliaryBarVisibleContext,
			}, {
				id: MenuId.AuxiliaryBarTitle,
				group: 'navigation',
				order: 2,
				when: ContextKeyExpr.equals(`config.${LayoutSettings.ACTIVITY_BAR_LOCATION}`, ActivityBarPosition.DEFAULT)
			}]
		});
	}
	run(accessor: ServicesAccessor) {
		accessor.get(IWorkbenchLayoutService).setPartHidden(true, Parts.AUXILIARYBAR_PART);
	}
});

MenuRegistry.appendMenuItems([
	{
		id: MenuId.LayoutControlMenu,
		item: {
			group: '2_pane_toggles',
			command: {
				id: TogglePanelAction.ID,
				title: localize('togglePanel', "Toggle Panel"),
				icon: panelOffIcon,
				toggled: { condition: PanelVisibleContext, icon: panelIcon }
			},
			when: ContextKeyExpr.or(ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')),
			order: 1
		}
	}, {
		id: MenuId.ViewTitleContext,
		item: {
			group: '3_workbench_layout_move',
			command: {
				id: TogglePanelAction.ID,
				title: localize2('hidePanel', 'Hide Panel'),
			},
			when: ContextKeyExpr.and(PanelVisibleContext, ContextKeyExpr.equals('viewLocation', ViewContainerLocationToString(ViewContainerLocation.Panel))),
			order: 2
		}
	}
]);

class MoveViewsBetweenPanelsAction extends Action2 {
	constructor(private readonly source: ViewContainerLocation, private readonly destination: ViewContainerLocation, desc: Readonly<IAction2Options>) {
		super(desc);
	}

	run(accessor: ServicesAccessor, ...args: any[]): void {
		const viewDescriptorService = accessor.get(IViewDescriptorService);
		const layoutService = accessor.get(IWorkbenchLayoutService);
		const viewsService = accessor.get(IViewsService);

		const srcContainers = viewDescriptorService.getViewContainersByLocation(this.source);
		const destContainers = viewDescriptorService.getViewContainersByLocation(this.destination);

		if (srcContainers.length) {
			const activeViewContainer = viewsService.getVisibleViewContainer(this.source);

			srcContainers.forEach(viewContainer => viewDescriptorService.moveViewContainerToLocation(viewContainer, this.destination, undefined, this.desc.id));
			layoutService.setPartHidden(false, this.destination === ViewContainerLocation.Panel ? Parts.PANEL_PART : Parts.AUXILIARYBAR_PART);

			if (activeViewContainer && destContainers.length === 0) {
				viewsService.openViewContainer(activeViewContainer.id, true);
			}
		}
	}
}


// Move Pear AI extension to PearAI Side Bar (Auxiliary Bar) (we want PearAI Side Bar to be default loaction for extension)
class MovePearExtensionToAuxBarAction extends MoveViewsBetweenPanelsAction {
    static readonly ID = 'workbench.action.movePearExtensionToAuxBar';

    constructor() {
        super(ViewContainerLocation.Sidebar, ViewContainerLocation.AuxiliaryBar, {
            id: MovePearExtensionToAuxBarAction.ID,
            title: localize2('movePearExtensionToAuxBar', "Move Pear Extension to Auxiliary Bar"),
            category: Categories.View,
            f1: true
        });
    }

    override run(accessor: ServicesAccessor): void {
        const viewDescriptorService = accessor.get(IViewDescriptorService);
        const layoutService = accessor.get(IWorkbenchLayoutService);
        const viewsService = accessor.get(IViewsService);

        const chatViewContainer = viewDescriptorService.getViewContainerById(PearAIChatExtensionId);
        const searchViewContainer = viewDescriptorService.getViewContainerById(PearAISearchExtensionId);
        const memoryViewContainer = viewDescriptorService.getViewContainerById(PearAIMemoryExtensionId);
        const agentViewContainer = viewDescriptorService.getViewContainerById(PearAIRooExtensionId);

        const destination = ViewContainerLocation.AuxiliaryBar;

        if (chatViewContainer) {
            viewDescriptorService.moveViewContainerToLocation(chatViewContainer, destination, undefined, this.desc.id);
            layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
            viewsService.openViewContainer(chatViewContainer.id, true);
        }
        if (searchViewContainer) {
                viewDescriptorService.moveViewContainerToLocation(searchViewContainer, destination, undefined, this.desc.id);
                layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
                // viewsService.openViewContainer(searchViewContainer.id, true);
            }
        if (memoryViewContainer) {
                viewDescriptorService.moveViewContainerToLocation(memoryViewContainer, destination, undefined, this.desc.id);
                layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
                // viewsService.openViewContainer(memoryViewContainer.id, true);
            }
        if (agentViewContainer) {
                viewDescriptorService.moveViewContainerToLocation(agentViewContainer, destination, undefined, this.desc.id);
                layoutService.setPartHidden(false, Parts.AUXILIARYBAR_PART);
                // viewsService.openViewContainer(agentViewContainer.id, true);
            }
        }
}

registerAction2(MovePearExtensionToAuxBarAction);

// --- Move Panel Views To PearAI Side Bar

class MovePanelToSidePanelAction extends MoveViewsBetweenPanelsAction {
	static readonly ID = 'workbench.action.movePanelToSidePanel';
	constructor() {
		super(ViewContainerLocation.Panel, ViewContainerLocation.AuxiliaryBar, {
			id: MovePanelToSidePanelAction.ID,
			title: localize2('movePanelToSecondarySideBar', "Move Panel Views To PearAI Side Bar"),
			category: Categories.View,
			f1: false
		});
	}
}

export class MovePanelToSecondarySideBarAction extends MoveViewsBetweenPanelsAction {
	static readonly ID = 'workbench.action.movePanelToSecondarySideBar';
	constructor() {
		super(ViewContainerLocation.Panel, ViewContainerLocation.AuxiliaryBar, {
			id: MovePanelToSecondarySideBarAction.ID,
			title: localize2('movePanelToSecondarySideBar', "Move Panel Views To PearAI Side Bar"),
			category: Categories.View,
			f1: true
		});
	}
}

registerAction2(MovePanelToSidePanelAction);
registerAction2(MovePanelToSecondarySideBarAction);

// --- Move PearAI Side Bar Views To Panel

class MoveSidePanelToPanelAction extends MoveViewsBetweenPanelsAction {
	static readonly ID = 'workbench.action.moveSidePanelToPanel';

	constructor() {
		super(ViewContainerLocation.AuxiliaryBar, ViewContainerLocation.Panel, {
			id: MoveSidePanelToPanelAction.ID,
			title: localize2('moveSidePanelToPanel', "Move PearAI Side Bar Views To Panel"),
			category: Categories.View,
			f1: false
		});
	}
}

export class MoveSecondarySideBarToPanelAction extends MoveViewsBetweenPanelsAction {
	static readonly ID = 'workbench.action.moveSecondarySideBarToPanel';

	constructor() {
		super(ViewContainerLocation.AuxiliaryBar, ViewContainerLocation.Panel, {
			id: MoveSecondarySideBarToPanelAction.ID,
			title: localize2('moveSidePanelToPanel', "Move PearAI Side Bar Views To Panel"),
			category: Categories.View,
			f1: true
		});
	}
}
registerAction2(MoveSidePanelToPanelAction);
registerAction2(MoveSecondarySideBarToPanelAction);
