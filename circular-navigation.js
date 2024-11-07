const CONSTANTS = {
    // Existing constants
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    MIN_RADIUS: 170,
    RADIUS_PADDING: 170,
    DEPTH_TWO_RADIUS: 50,
    TRANSITION_DURATION: 500,
    ASPECT_RATIO: 1.25,
    BREAKPOINTS: {
        SMALL: 768,
        MEDIUM: 1024,
        LARGE: 1440
    },
    TEXT_SIZES: {
        SMALL: {
            CENTER: 13,
            DEPTH_ONE: 12,
            DEPTH_TWO: 10
        },
        MEDIUM: {
            CENTER: 14,
            DEPTH_ONE: 13,
            DEPTH_TWO: 12
        },
        LARGE: {
            CENTER: 14,
            DEPTH_ONE: 13,
            DEPTH_TWO: 13
        }
    },

    // New constants to add
    RESIZE: {
        DEBOUNCE_DELAY: 250,
        SIGNIFICANT_CHANGE_THRESHOLD: 0.01
    },

    ZOOM: {
        MIN_SCALE: 0.5,
        MAX_SCALE: 3,
        STEP_INCREASE: 1.1,
        STEP_DECREASE: 0.9
    },

    NODE_SIZES: {
        CENTRAL: {
            WIDTH: 90,
            HEIGHT: 90
        },
        DEFAULT: {
            MIN_WIDTH: 75,
            MIN_HEIGHT: 60,
            PADDING: 10
        }
    },

    INDICATORS: {
        INNER_RADIUS: 5,
        OUTER_RADIUS: 8,
        ACTIVE_SCALE: 1.2  // Optional: for hover/active states
    },
    
    TEXT_LAYOUT: {
        BASE_HEIGHT: 40,
        WIDTH: 120,
        PADDING: 4,
        BASE_SPACING: 32,
        SIDE_SPACING_BOOST: 30,
        MIN_SPACING: 0,
        LONG_TEXT_THRESHOLD: 11
    },

    CACHE: {
        MAX_SIZE: 50,
        PRELOAD_DELAY: 1000
    },

    ANIMATION: {
        INIT_DELAY: 100,
        FORCE_ITERATIONS: 10
    }
};


class MinimumViabilityManager {
    constructor() {
        // Core constants based on accessibility standards
        this.MINIMUM_REQUIREMENTS = {
            TOUCH_TARGET: {
                MOBILE: 44,    // iOS HIG minimum
                TABLET: 40,    // Material Dgeesign minimum
                DESKTOP: 32    // General minimum
            },
            TEXT: {
                MINIMUM_SIZE: 12,         // Absolute minimum readable size
                PREFERRED_SIZE: 16,       // Optimal reading size
                HEADER_SIZE: 18,          // Minimum header size
                LINE_HEIGHT: 1.5          // Minimum line height ratio
            },
            SPACING: {
                MINIMUM_GAP: 8,           // Minimum space between elements
                PREFERRED_GAP: 16,        // Optimal space between elements
                TOUCH_PADDING: 8          // Additional padding for touch targets
            }
        };
    }

    detectDeviceType() {
        const width = window.innerWidth;
        const isTouchDevice = ('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0);
            
        if (width < 768) {
            return 'MOBILE';
        } else if (width < 1024 || isTouchDevice) {
            return 'TABLET';
        } else {
            return 'DESKTOP';
        }
    }

    calculateMinimumSizes(containerWidth, containerHeight, deviceType) {
        const smallestDimension = Math.min(containerWidth, containerHeight);
        const touchTarget = this.MINIMUM_REQUIREMENTS.TOUCH_TARGET[deviceType];
        
        return {
            node: {
                central: {
                    size: Math.max(touchTarget * 2, smallestDimension * 0.15)
                },
                primary: {
                    width: Math.max(touchTarget * 1.5, smallestDimension * 0.1),
                    height: Math.max(touchTarget, smallestDimension * 0.08)
                },
                secondary: {
                    width: Math.max(touchTarget, smallestDimension * 0.08),
                    height: Math.max(touchTarget, smallestDimension * 0.06)
                }
            },
            text: {
                node: {
                    central: this.MINIMUM_REQUIREMENTS.TEXT.HEADER_SIZE,
                    primary: this.MINIMUM_REQUIREMENTS.TEXT.PREFERRED_SIZE,
                    secondary: this.MINIMUM_REQUIREMENTS.TEXT.MINIMUM_SIZE
                }
            },
            spacing: {
                nodeGap: Math.max(
                    this.MINIMUM_REQUIREMENTS.SPACING.MINIMUM_GAP,
                    touchTarget * 0.5
                ),
                nodePadding: this.MINIMUM_REQUIREMENTS.SPACING.TOUCH_PADDING,
                labelOffset: this.MINIMUM_REQUIREMENTS.SPACING.PREFERRED_GAP
            }
        };
    }

    validateSizes(currentSizes, containerWidth, containerHeight) {
        const deviceType = this.detectDeviceType();
        const minimumSizes = this.calculateMinimumSizes(
            containerWidth, 
            containerHeight, 
            deviceType
        );
    
        const validationResults = {
            isValid: true,
            adjustments: []
        };
    
        // Only validate if we have current sizes
        if (!currentSizes || !currentSizes.NODE_SIZES) {
            return validationResults; // Return valid if we don't have sizes to validate
        }
    
        // Validate node sizes
        try {
            // Central node
            if (currentSizes.NODE_SIZES.CENTRAL.WIDTH < minimumSizes.node.central.size) {
                validationResults.adjustments.push({
                    type: 'node',
                    element: 'central',
                    dimension: 'width',
                    current: currentSizes.NODE_SIZES.CENTRAL.WIDTH,
                    required: minimumSizes.node.central.size
                });
                validationResults.isValid = false;
            }
    
            // Default nodes
            if (currentSizes.NODE_SIZES.DEFAULT.MIN_WIDTH < minimumSizes.node.primary.width) {
                validationResults.adjustments.push({
                    type: 'node',
                    element: 'primary',
                    dimension: 'width',
                    current: currentSizes.NODE_SIZES.DEFAULT.MIN_WIDTH,
                    required: minimumSizes.node.primary.width
                });
                validationResults.isValid = false;
            }
    
            // Text sizes
            if (currentSizes.TEXT_SIZES) {
                Object.entries(currentSizes.TEXT_SIZES.MEDIUM).forEach(([key, value]) => {
                    const minimumValue = minimumSizes.text.node[key.toLowerCase()];
                    if (value < minimumValue) {
                        validationResults.adjustments.push({
                            type: 'text',
                            element: key,
                            current: value,
                            required: minimumValue
                        });
                        validationResults.isValid = false;
                    }
                });
            }
        } catch (error) {
            console.warn('Error during size validation:', error);
            return validationResults; // Return valid if validation fails
        }
    
        return validationResults;
    }
}

class ResponsiveConstants {
    constructor(baseConstants = CONSTANTS) {
        this.base = baseConstants;
        this.current = {};
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.minimumViability = new MinimumViabilityManager();
    }

    calculate(containerWidth, containerHeight, contentData = null) {
        console.log('Incoming contentData:', contentData);
        
        // Get device type and minimum viable sizes
        const deviceType = this.minimumViability.detectDeviceType();
        const minimumSizes = this.minimumViability.calculateMinimumSizes(
            containerWidth,
            containerHeight,
            deviceType
        );
    
        // Calculate base dimensions with minimum constraints
        const dims = this.calculateBaseDimensions(
            containerWidth, 
            containerHeight,
            minimumSizes
        );
    
        // Process the data if it exists
        let processedData = null;
        if (contentData && typeof contentData === 'object') {
            try {
                processedData = d3.hierarchy(contentData);
                console.log('Processed hierarchy:', processedData);
            } catch (error) {
                console.error('Error creating hierarchy:', error);
            }
        }
    
        // Calculate metrics
        const textSizes = this.calculateTextSizes(dims.width, minimumSizes.text);
        const nodeMetrics = this.calculateNodeMetrics(dims, processedData, minimumSizes.node);
        const spacingMetrics = this.calculateSpacingMetrics(dims, nodeMetrics, minimumSizes.spacing);
    
        // Create the current sizes object for validation
        const currentSizes = {
            NODE_SIZES: nodeMetrics,
            TEXT_SIZES: textSizes,
            LAYOUT: spacingMetrics
        };
    
        // Validate sizes
        const validation = this.minimumViability.validateSizes(
            currentSizes,
            containerWidth,
            containerHeight
        );
    
        // Apply any necessary adjustments
        if (!validation.isValid) {
            this.applyValidationAdjustments(validation.adjustments, currentSizes);
        }
    
        // Return final constants
        return {
            ...this.base,
            ...dims,
            NODE_SIZES: currentSizes.NODE_SIZES,
            TEXT_SIZES: currentSizes.TEXT_SIZES,
            LAYOUT: currentSizes.LAYOUT,
            DEVICE_TYPE: deviceType
        };
    }

    calculateBaseDimensions(width, height, minimumSizes) {
        // Ensure we have valid input dimensions
        const containerWidth = Math.max(width || this.base.MIN_WIDTH, this.base.MIN_WIDTH);
        const containerHeight = Math.max(height || this.base.MIN_HEIGHT, this.base.MIN_HEIGHT);
        
        // Calculate maximum allowed height (70vh)
        const maxHeight = Math.min(
            containerHeight,
            window.innerHeight * 0.7,
            window.innerHeight - 100 // Additional safety margin
        );
        
        // Calculate the space needed for outer text and nodes
        const outerNodePadding = 120; // Space for outer text labels
        const outerCirclePadding = 40; // Additional padding for outer circle
        
        // Calculate available space after accounting for outer elements
        const availableWidth = containerWidth - (outerNodePadding * 2);
        const availableHeight = Math.min(
            maxHeight - (outerNodePadding * 2),
            availableWidth * 0.8
        );
        
        // Ensure minimum viable size with padding for outer elements
        const minDimension = Math.max(
            (minimumSizes?.node?.central?.size || 170) * 3,
            Math.min(availableWidth, availableHeight) * 0.2
        );
    
        // Calculate base dimensions while maintaining aspect ratio
        const minWidth = Math.max(
            this.base.MIN_WIDTH,
            availableWidth * 0.9,
            minDimension
        );
        
        const minHeight = Math.max(
            this.base.MIN_HEIGHT,
            Math.min(availableHeight * 0.95, maxHeight * 0.95),
            minDimension * 1.2
        );
        
        // Use an aspect ratio that works well with 70vh constraint
        const aspectRatio = 1.2;
        let finalWidth, finalHeight;
    
        if (availableWidth / availableHeight > aspectRatio) {
            finalHeight = Math.min(minHeight, maxHeight - (outerNodePadding * 2));
            finalWidth = Math.min(finalHeight * aspectRatio, availableWidth);
        } else {
            finalWidth = minWidth;
            finalHeight = Math.min(finalWidth / aspectRatio, maxHeight - (outerNodePadding * 2));
        }
    
        // Calculate responsive radius with space for outer elements
        const baseRadius = Math.min(finalWidth, finalHeight) * 0.35;
        const minRadius = Math.max(
            this.base.MIN_RADIUS,
            (minimumSizes?.node?.central?.size || 170) * 1.4,
            Math.min(baseRadius, finalWidth * 0.4)
        );
    
        // Add padding for outer circle and text
        const totalWidth = finalWidth + (outerNodePadding * 2);
        const totalHeight = Math.min(
            finalHeight + (outerNodePadding * 2),
            maxHeight
        );
    
        // Ensure we never return zero dimensions
        const safeWidth = Math.max(totalWidth, this.base.MIN_WIDTH);
        const safeHeight = Math.max(totalHeight, Math.min(this.base.MIN_HEIGHT, maxHeight));
        
        console.log('Dimension calculation:', {
            containerWidth,
            containerHeight,
            maxHeight,
            availableWidth,
            availableHeight,
            finalWidth,
            finalHeight,
            totalWidth: safeWidth,
            totalHeight: safeHeight
        });

        return {
            width: safeWidth,
            height: safeHeight,
            radius: minRadius,
            RADIUS_PADDING: Math.max(
                minRadius * 0.3,
                (minimumSizes?.spacing?.nodeGap || 20) * 2
            ),
            DEPTH_TWO_RADIUS: Math.max(
                minRadius * 0.2,
                (minimumSizes?.node?.secondary?.width || 50) / 2
            ),
            OUTER_NODE_PADDING: outerNodePadding,
            OUTER_CIRCLE_PADDING: outerCirclePadding,
            MAX_HEIGHT: maxHeight
        };
    }


    applyValidationAdjustments(adjustments, sizes) {
        adjustments.forEach(adjustment => {
            switch (adjustment.type) {
                case 'text':
                    sizes.text.node[adjustment.element] = adjustment.required;
                    break;
                case 'node':
                    sizes.node[adjustment.element][adjustment.dimension] = adjustment.required;
                    break;
                case 'spacing':
                    sizes.spacing[adjustment.element] = adjustment.required;
                    break;
            }
        });
    }
    
    calculateTextSizes(width, minimumTextSizes) {
        const minWidth = this.base.BREAKPOINTS.SMALL;
        const maxWidth = this.base.BREAKPOINTS.LARGE;
        
        // Set default minimum sizes if not provided
        const minSizes = minimumTextSizes?.node || {
            central: CONSTANTS.TEXT_SIZES.SMALL.CENTER,
            primary: CONSTANTS.TEXT_SIZES.SMALL.DEPTH_ONE,
            secondary: CONSTANTS.TEXT_SIZES.SMALL.DEPTH_TWO
        };
        
        const calculateFluidSize = (minSize, maxSize, minimumSize) => {
            const slope = (maxSize - minSize) / (maxWidth - minWidth);
            const baseline = minSize - slope * minWidth;
            const calculatedSize = slope * width + baseline;
            return Math.max(minimumSize || minSize, Math.min(maxSize, calculatedSize));
        };
    
        return {
            SMALL: {
                CENTER: calculateFluidSize(13, 16, minSizes.central),
                DEPTH_ONE: calculateFluidSize(12, 14, minSizes.primary),
                DEPTH_TWO: calculateFluidSize(10, 12, minSizes.secondary)
            },
            MEDIUM: {
                CENTER: calculateFluidSize(14, 18, minSizes.central),
                DEPTH_ONE: calculateFluidSize(13, 16, minSizes.primary),
                DEPTH_TWO: calculateFluidSize(12, 14, minSizes.secondary)
            },
            LARGE: {
                CENTER: calculateFluidSize(16, 20, minSizes.central),
                DEPTH_ONE: calculateFluidSize(14, 18, minSizes.primary),
                DEPTH_TWO: calculateFluidSize(13, 16, minSizes.secondary)
            }
        };
    }

    calculateNodeMetrics(dims, contentData, minimumNodes) {
        const baseSize = Math.min(dims.width, dims.height);
        
        // Calculate content-aware sizes with minimum constraints
        const getMaxContentLength = (depth) => {
            if (!contentData) return 20; // Default fallback length
            try {
                const nodes = contentData
                    .descendants()
                    .filter(n => n.depth === depth)
                    .map(n => {
                        // Safe access to name property
                        if (n && n.data && typeof n.data.name === 'string') {
                            return n.data.name.length;
                        }
                        return 0;
                    })
                    .filter(length => length > 0); // Remove any zero lengths
                
                // If we have valid lengths, return max, otherwise return default
                return nodes.length > 0 ? Math.max(...nodes) : 20;
            } catch (error) {
                console.log('Error calculating max content length:', error);
                // Return sensible defaults based on depth
                return depth === 1 ? 20 : 15;
            }
        };
    
        // Get max content lengths for different depths
        const maxDepthOneLength = getMaxContentLength(1);
        const maxDepthTwoLength = getMaxContentLength(2);
    
        // Calculate font metrics for accurate sizing
        const getTextWidth = (text, fontSize) => {
            // Approximate character width based on font size
            return text.length * (fontSize * 0.6);
        };

        // Calculate minimum widths needed for text content
        const depthOneFontSize = this.calculateTextSizes(dims.width, minimumNodes.text).MEDIUM.DEPTH_ONE;
        const depthTwoFontSize = this.calculateTextSizes(dims.width, minimumNodes.text).MEDIUM.DEPTH_TWO;
        
        const minDepthOneWidth = getTextWidth(maxDepthOneLength, depthOneFontSize);
        const minDepthTwoWidth = getTextWidth(maxDepthTwoLength, depthTwoFontSize);

        // Calculate sizes based on content and minimum requirements
        const centralWidth = Math.max(
            minimumNodes.central.size,
            baseSize * 0.15,
            this.base.NODE_SIZES.CENTRAL.WIDTH
        );

        const depthOneWidth = Math.max(
            minimumNodes.primary.width,
            minDepthOneWidth + (minimumNodes.primary.width * 0.4), // Add padding
            this.base.NODE_SIZES.DEFAULT.MIN_WIDTH,
            dims.width * 0.1
        );

        const depthTwoWidth = Math.max(
            minimumNodes.secondary.width,
            minDepthTwoWidth + (minimumNodes.secondary.width * 0.4),
            this.base.NODE_SIZES.DEFAULT.MIN_WIDTH * 0.8,
            dims.width * 0.08
        );

        // Calculate heights proportionally
        const depthOneHeight = Math.max(
            minimumNodes.primary.height,
            depthOneWidth * 0.6,
            baseSize * 0.08
        );

        const depthTwoHeight = Math.max(
            minimumNodes.secondary.height,
            depthTwoWidth * 0.6,
            baseSize * 0.06
        );

        return {
            CENTRAL: {
                WIDTH: centralWidth,
                HEIGHT: centralWidth
            },
            DEFAULT: {
                MIN_WIDTH: depthOneWidth,
                MIN_HEIGHT: depthOneHeight,
                DEPTH_TWO_WIDTH: depthTwoWidth,
                DEPTH_TWO_HEIGHT: depthTwoHeight,
                PADDING: Math.max(
                    10,
                    baseSize * 0.015
                )
            }
        };
    }

    calculateSpacingMetrics(dims, nodeMetrics, minimumSpacing) {
        const baseSize = Math.min(dims.width, dims.height);
        
        // Calculate minimum spacing between nodes based on node sizes
        const minNodeSpacing = Math.max(
            minimumSpacing.nodeGap,
            Math.max(nodeMetrics.DEFAULT.MIN_WIDTH, nodeMetrics.DEFAULT.MIN_HEIGHT) * 0.3
        );

        // Calculate text label spacing based on text size and container
        const textSpacing = Math.max(
            minimumSpacing.labelOffset,
            baseSize * 0.05,
            nodeMetrics.DEFAULT.MIN_WIDTH * 0.5
        );

        return {
            TEXT_SPACING: {
                BASE: Math.max(
                    minNodeSpacing,
                    20,
                    baseSize * 0.03
                ),
                OUTER: Math.max(
                    textSpacing,
                    32,
                    baseSize * 0.05
                ),
                PADDING: Math.max(
                    minimumSpacing.nodePadding,
                    4,
                    baseSize * 0.006
                )
            },
            LINK_METRICS: {
                WIDTH: Math.max(1.5, baseSize * 0.002),
                WIDTH_ACTIVE: Math.max(2, baseSize * 0.003),
                CURVE_TENSION: this.calculateCurveTension(dims, nodeMetrics)
            },
            ANIMATION: {
                DURATION: this.calculateAnimationDuration(baseSize),
                STAGGER_DELAY: Math.min(50, baseSize * 0.05)
            }
        };
    }

    calculateCurveTension(dims, nodeMetrics) {
        // Adjust curve tension based on available space and node sizes
        const baseSize = Math.min(dims.width, dims.height);
        const nodeDensity = (nodeMetrics.DEFAULT.MIN_WIDTH * nodeMetrics.DEFAULT.MIN_HEIGHT) / 
                           (baseSize * baseSize);
        
        // More space = smoother curves (lower tension)
        // Less space = sharper curves (higher tension)
        return Math.max(0.3, Math.min(0.8, 0.65 + (nodeDensity - 0.1) * 2));
    }

    calculateAnimationDuration(baseSize) {
        // Scale animation duration with container size
        // Larger containers = longer animations for smoother feel
        // But cap at reasonable maximum
        const scaledDuration = baseSize * 0.5;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            return Math.min(200, scaledDuration * 0.5);
        }
        return Math.min(500, scaledDuration);
    }

    // Close the class
}

// Create the main constants manager
const responsiveConstants = new ResponsiveConstants(CONSTANTS);

// Update your initialization function
function initializeCircularNavigation(data) {
    console.log('Initializing with data:', data);
    
    // Get container
    const container = document.querySelector(".circular-navigation-container");
    if (!container) {
        console.error("Container not found");
        return;
    }
    
    // Store data globally for settings panel access
    window.currentData = data;
    
    // Initialize managers
    const resizeManager = new ResizeManager();
    const transitionManager = new TransitionManager();
    
    // Get responsive constants based on current container size
    const constants = responsiveConstants.calculate(
        container.clientWidth,
        container.clientHeight,
        data  // Pass the data for content-aware calculations
    );
    
    console.log('Calculated constants:', constants);
    
    // Calculate initial dimensions
    const initialDimensions = {
        width: constants.width,
        height: constants.height,
        radius: constants.radius,
        textSizes: constants.TEXT_SIZES
    };
    
    console.log('Initial dimensions:', initialDimensions);
    
    // Setup initial visualization
    setupVisualization(data, initialDimensions, transitionManager);
    
    // Verify visualization was created
    const svg = d3.select("#circular-nav-svg");
    console.log('SVG created:', !svg.empty());
    const rootNode = svg.select('.depth-0-node');
    console.log('Root node created:', !rootNode.empty());

    // Setup resize handling
    resizeManager.init(container, (dimensions) => {
        const updatedConstants = responsiveConstants.calculate(
            dimensions.width,
            dimensions.height,
            data
        );
        updateVisualization(data, {
            ...dimensions,
            ...updatedConstants
        }, transitionManager);
    });

    // Initialize settings panel
    const settingsPanel = initializeSettingsPanel(constants);
    
    // Store cleanup function
    window.cleanupCircularNavigation = () => {
        resizeManager.destroy();
        transitionManager.cancelAll();
        settingsPanel.destroy();
        cleanup();
    };

    // If we're in the dilemma tab, load initial content
    if (isDilemmaTabActive()) {
        if (window.lastSelectedNodeId) {
            fetchRelatedPostContent(window.lastSelectedNodeId);
        } else {
            loadRootNodeContent();
        }
    }
}




// ResizeManager class to handle all resize-related logic
class ResizeManager {
    calculateOptimalDimensions(width, height) {
        const constants = responsiveConstants.calculate(width, height);
        return {
            width: constants.width,
            height: constants.height,
            radius: constants.radius,
            breakpoint: this.getBreakpoint(width),
            textSizes: constants.TEXT_SIZES
        };
    }
    constructor() {
        this.resizeObserver = null;
        this.debounceTimeout = null;
        this.isResizing = false;
        this.lastDimensions = { width: 0, height: 0 };
    }

    init(container, callback) {
        // Clean up existing observer if any
        this.destroy();

        // Create new resize observer
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                
                // Only trigger if dimensions actually changed significantly (>1%)
                const significantChange = 
                    Math.abs(width - this.lastDimensions.width) > this.lastDimensions.width * 0.01 ||
                    Math.abs(height - this.lastDimensions.height) > this.lastDimensions.height * 0.01;

                if (significantChange) {
                    this.handleResize(width, height, callback);
                }
            }
        });

        // Start observing
        this.resizeObserver.observe(container);
    }

    handleResize(width, height, callback) {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.isResizing = true;
        this.debounceTimeout = setTimeout(() => {
            this.isResizing = false;
            this.lastDimensions = { width, height };
            callback(this.calculateOptimalDimensions(width, height));
        }, CONSTANTS.RESIZE.DEBOUNCE_DELAY);
    }

    calculateOptimalDimensions(width, height) {
        // Ensure minimum dimensions
        width = Math.max(width, CONSTANTS.MIN_WIDTH);
        height = Math.max(height, CONSTANTS.MIN_HEIGHT);

        // Calculate dimensions maintaining aspect ratio
        const currentRatio = width / height;
        let finalWidth = width;
        let finalHeight = height;

        if (currentRatio > CONSTANTS.ASPECT_RATIO) {
            // Too wide - adjust width
            finalWidth = height * CONSTANTS.ASPECT_RATIO;
        } else {
            // Too tall - adjust height
            finalHeight = width / CONSTANTS.ASPECT_RATIO;
        }

        // Calculate optimal radius
        const radius = Math.max(
            Math.min(finalWidth, finalHeight) / 2 - CONSTANTS.RADIUS_PADDING,
            CONSTANTS.MIN_RADIUS
        );

        // Determine breakpoint
        const breakpoint = this.getBreakpoint(width);

        return {
            width: finalWidth,
            height: finalHeight,
            radius,
            breakpoint,
            textSizes: CONSTANTS.TEXT_SIZES[breakpoint]
        };
    }

    getBreakpoint(width) {
        if (width < CONSTANTS.BREAKPOINTS.SMALL) return 'SMALL';
        if (width < CONSTANTS.BREAKPOINTS.MEDIUM) return 'MEDIUM';
        return 'LARGE';
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }
}

// Utility Functions
function getCSSVariable(variable) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
}


function project(x, y) {
    const angle = x - Math.PI / 2;
    return [y * Math.cos(angle), y * Math.sin(angle)];
}

function isActivePath(link, selectedNode) {
    if (!link || !link.source || !link.target || !selectedNode) return false;
    
    if (selectedNode.depth === 0) {
        return true;
    } else if (selectedNode.depth === 1) {
        return (selectedNode.parent && link.source === selectedNode.parent && link.target === selectedNode) ||
               (link.source === selectedNode);
    } else if (selectedNode.depth === 2) {
        return (link.target === selectedNode) || 
               (selectedNode.parent && link.source === selectedNode.parent && link.target === selectedNode) ||
               (selectedNode.parent && selectedNode.parent.parent && 
                link.source === selectedNode.parent.parent && link.target === selectedNode.parent);
    }
    return false;
}

function isSiblingPath(link, selectedNode) {
    if (!link || !link.source || !link.target || !selectedNode) return false;
    
    if (selectedNode.depth === 1) {
        return (selectedNode.parent && link.source === selectedNode.parent && link.target !== selectedNode) ||
               (link.source !== selectedNode.parent && link.source.parent === selectedNode.parent && 
                link.source !== selectedNode);
    } else if (selectedNode.depth === 2) {
        return (selectedNode.parent && link.source === selectedNode.parent && link.target !== selectedNode) ||
               (selectedNode.parent && selectedNode.parent.parent && 
                link.source !== selectedNode.parent.parent && link.target.depth === 2 && 
                link.target !== selectedNode);
    }
    return false;
}


// Create a settings panel class to manage the UI and updates
class SettingsPanel {
    constructor(constants, updateCallback) {
        this.constants = constants;
        this.updateCallback = updateCallback;
        this.panel = null;
        this.isVisible = false;
        
        // Define settings with flat structure
        this.sections = [
            {
                title: 'Basic Dimensions',
                settings: [
                    {
                        label: 'Minimum Width',
                        path: 'MIN_WIDTH',
                        type: 'number',
                        min: 200,
                        max: 2000,
                        step: 50
                    },
                    {
                        label: 'Minimum Height',
                        path: 'MIN_HEIGHT',
                        type: 'number',
                        min: 200,
                        max: 2000,
                        step: 50
                    },
                    {
                        label: 'Aspect Ratio',
                        path: 'ASPECT_RATIO',
                        type: 'number',
                        min: 0.5,
                        max: 2,
                        step: 0.1
                    }
                ]
            },
            {
                title: 'Text Layout',
                settings: [
                    {
                        label: 'Base Height',
                        path: 'TEXT_LAYOUT.BASE_HEIGHT',
                        type: 'number',
                        min: 20,
                        max: 80,
                        step: 5
                    },
                    {
                        label: 'Width',
                        path: 'TEXT_LAYOUT.WIDTH',
                        type: 'number',
                        min: 60,
                        max: 200,
                        step: 10
                    },
                    {
                        label: 'Text Padding',
                        path: 'TEXT_LAYOUT.PADDING',
                        type: 'number',
                        min: 2,
                        max: 12,
                        step: 1
                    },
                    {
                        label: 'Base Spacing',
                        path: 'TEXT_LAYOUT.BASE_SPACING',
                        type: 'number',
                        min: 16,
                        max: 64,
                        step: 4
                    },
                    {
                        label: 'Side Spacing Boost',
                        path: 'TEXT_LAYOUT.SIDE_SPACING_BOOST',
                        type: 'number',
                        min: 10,
                        max: 60,
                        step: 5
                    },
                    {
                        label: 'Long Text Threshold',
                        path: 'TEXT_LAYOUT.LONG_TEXT_THRESHOLD',
                        type: 'number',
                        min: 5,
                        max: 20,
                        step: 1
                    }
                ]
            },
            {
                title: 'Text Sizes - Small Screens',
                subtitle: '< 768px',
                settings: [
                    {
                        label: 'Center Node',
                        path: 'TEXT_SIZES.SMALL.CENTER',
                        type: 'number',
                        min: 10,
                        max: 24
                    },
                    {
                        label: 'Inner Circle',
                        path: 'TEXT_SIZES.SMALL.DEPTH_ONE',
                        type: 'number',
                        min: 8,
                        max: 20
                    },
                    {
                        label: 'Outer Circle',
                        path: 'TEXT_SIZES.SMALL.DEPTH_TWO',
                        type: 'number',
                        min: 8,
                        max: 18
                    }
                ]
            },
            {
                title: 'Text Sizes - Medium Screens',
                subtitle: '768px - 1024px',
                settings: [
                    {
                        label: 'Center Node',
                        path: 'TEXT_SIZES.MEDIUM.CENTER',
                        type: 'number',
                        min: 12,
                        max: 28
                    },
                    {
                        label: 'Inner Circle',
                        path: 'TEXT_SIZES.MEDIUM.DEPTH_ONE',
                        type: 'number',
                        min: 10,
                        max: 24
                    },
                    {
                        label: 'Outer Circle',
                        path: 'TEXT_SIZES.MEDIUM.DEPTH_TWO',
                        type: 'number',
                        min: 10,
                        max: 20
                    }
                ]
            },
            {
                title: 'Text Sizes - Large Screens',
                subtitle: '> 1024px',
                settings: [
                    {
                        label: 'Center Node',
                        path: 'TEXT_SIZES.LARGE.CENTER',
                        type: 'number',
                        min: 14,
                        max: 32
                    },
                    {
                        label: 'Inner Circle',
                        path: 'TEXT_SIZES.LARGE.DEPTH_ONE',
                        type: 'number',
                        min: 12,
                        max: 28
                    },
                    {
                        label: 'Outer Circle',
                        path: 'TEXT_SIZES.LARGE.DEPTH_TWO',
                        type: 'number',
                        min: 12,
                        max: 24
                    }
                ]
            },
            {
                title: 'Indicators',
                settings: [
                    {
                        label: 'Inner Radius',
                        path: 'INDICATORS.INNER_RADIUS',
                        type: 'number',
                        min: 3,
                        max: 10,
                        step: 1
                    },
                    {
                        label: 'Outer Radius',
                        path: 'INDICATORS.OUTER_RADIUS',
                        type: 'number',
                        min: 5,
                        max: 15,
                        step: 1
                    }
                ]
            }
        ];
    }

    initialize() {
        this.createPanel();
        this.createToggleButton();
        this.setupResponsiveHighlighting();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'settings-panel';
        
        const header = document.createElement('div');
        header.className = 'settings-header';
        header.innerHTML = '<h2>Visualization Settings</h2>';
        this.panel.appendChild(header);

        const content = document.createElement('div');
        content.className = 'settings-content';

        this.sections.forEach(section => {
            const sectionEl = this.createSection(section);
            content.appendChild(sectionEl);
        });

        this.panel.appendChild(content);
        document.body.appendChild(this.panel);
    }

    createSection(section) {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'settings-group';
        if (section.screenSize) {
            sectionEl.dataset.screenSize = section.screenSize;
        }
        
        const header = document.createElement('div');
        header.className = 'settings-group-header';
        header.innerHTML = `<h3>${section.title}</h3>`;
        if (section.subtitle) {
            header.innerHTML += `<div class="settings-group-subtitle">${section.subtitle}</div>`;
        }
        sectionEl.appendChild(header);

        section.settings.forEach(setting => {
            const control = this.createControl(setting);
            sectionEl.appendChild(control);
        });

        return sectionEl;
    }

    createControl(setting) {
        const control = document.createElement('div');
        control.className = 'settings-control';

        const label = document.createElement('label');
        label.textContent = setting.label;

        const wrapper = document.createElement('div');
        wrapper.className = 'settings-input-wrapper';

        const input = document.createElement('input');
        input.type = setting.type;
        if (setting.type === 'number') {
            input.min = setting.min;
            input.max = setting.max;
            input.step = setting.step || 1;
        }

        const value = this.getValueFromPath(this.constants, setting.path);
        input.value = value !== undefined ? value : '';

        input.addEventListener('input', () => {
            const newValue = setting.type === 'number' ? parseFloat(input.value) : input.value;
            if (this.setValueFromPath(this.constants, setting.path, newValue)) {
                this.updateVisualization();
            }
        });

        wrapper.appendChild(input);
        control.appendChild(label);
        control.appendChild(wrapper);

        if (setting.type === 'number') {
            const hint = document.createElement('div');
            hint.className = 'settings-value-hint';
            hint.textContent = `Min: ${setting.min}, Max: ${setting.max}`;
            control.appendChild(hint);
        }

        return control;
    }

    getValueFromPath(obj, path) {
        return path.split('.').reduce((acc, part) => {
            if (acc && typeof acc === 'object') {
                return acc[part];
            }
            return undefined;
        }, obj);
    }

    setValueFromPath(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((acc, part) => {
            if (!acc[part]) {
                acc[part] = {};
            }
            return acc[part];
        }, obj);

        if (target && typeof target === 'object') {
            target[last] = value;
            return true;
        }
        return false;
    }

    setupResponsiveHighlighting() {
        const updateHighlighting = () => {
            const width = window.innerWidth;
            const groups = this.panel.querySelectorAll('.settings-group[data-screen-size]');
            
            groups.forEach(group => {
                const screenSize = group.dataset.screenSize;
                if (screenSize === 'SMALL' && width < 768) {
                    group.classList.add('current-screen-size');
                } else if (screenSize === 'MEDIUM' && width >= 768 && width < 1024) {
                    group.classList.add('current-screen-size');
                } else if (screenSize === 'LARGE' && width >= 1024) {
                    group.classList.add('current-screen-size');
                } else {
                    group.classList.remove('current-screen-size');
                }
            });
        };

        // Initial check
        updateHighlighting();

        // Add resize listener with debounce
        window.addEventListener('resize', _.debounce(updateHighlighting, 250));
    }

    updateVisualization() {
        const container = document.querySelector(".circular-navigation-container");
        if (!container) return;

        const responsiveConstants = new ResponsiveConstants(this.constants);
        const dimensions = responsiveConstants.calculate(
            container.clientWidth,
            container.clientHeight,
            window.currentData
        );

        this.updateCallback(dimensions);
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'settings-toggle';
        button.innerHTML = '⚙️';
        button.addEventListener('click', () => this.togglePanel());
        document.body.appendChild(button);
    }

    togglePanel() {
        this.isVisible = !this.isVisible;
        this.panel.classList.toggle('visible', this.isVisible);
    }

    destroy() {
        if (this.panel) {
            this.panel.remove();
        }
        const toggleButton = document.querySelector('.settings-toggle');
        if (toggleButton) {
            toggleButton.remove();
        }
    }
}

/**
 * Initialize the settings panel with visualization update handling
 * @param {Object} constants - The CONSTANTS configuration object
 * @returns {SettingsPanel} The initialized settings panel instance
 */
function initializeSettingsPanel(constants) {
    // Validate input
    if (!constants || typeof constants !== 'object') {
        throw new Error('Invalid constants configuration provided');
    }

    // Store reference to previous panel for cleanup
    const existingPanel = window.currentSettingsPanel;
    if (existingPanel) {
        existingPanel.destroy();
    }

    // Create new settings panel instance
    const settingsPanel = new SettingsPanel(constants, (newConstants) => {
        try {
            // Update the visualization with new settings
            Object.assign(constants, newConstants);
            
            // Get current data and container
            const currentData = window.currentData;
            const container = document.querySelector(".circular-navigation-container");
            
            if (!container) {
                throw new Error("Visualization container not found");
            }
            if (!currentData) {
                throw new Error("Visualization data not found");
            }

            // Create managers
            const resizeManager = new ResizeManager();
            const transitionManager = new TransitionManager();

            // Calculate dimensions
            const dimensions = resizeManager.calculateOptimalDimensions(
                container.clientWidth || constants.MIN_WIDTH,
                container.clientHeight || constants.MIN_HEIGHT
            );

            // Update visualization
            updateVisualization(currentData, dimensions, transitionManager);

        } catch (error) {
            console.error('Error updating visualization:', error);
            settingsPanel.showNotification(
                'Error updating visualization: ' + error.message,
                'error'
            );
        }
    });

    // Store reference for future cleanup
    window.currentSettingsPanel = settingsPanel;

    // Initialize panel
    try {
        settingsPanel.initialize();
    } catch (error) {
        console.error('Error initializing settings panel:', error);
        return null;
    }

    return settingsPanel;
}


// Extend the SettingsPanel class with import/export functionality
class ProfileManager {
    constructor(settingsPanel) {
        this.settingsPanel = settingsPanel;
        this.profileSection = null;
    }

    initialize() {
        // Create profile section in settings panel
        this.profileSection = document.createElement('div');
        this.profileSection.className = 'settings-group';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'settings-group-header';
        header.innerHTML = '<h3>Profile Management & Device Info</h3>';
        this.profileSection.appendChild(header);

        // Add export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'settings-btn';
        exportBtn.innerHTML = '📤 Export Settings';
        exportBtn.onclick = () => this.exportSettings();
        
        // Add import button and file input
        const importBtn = document.createElement('button');
        importBtn.className = 'settings-btn';
        importBtn.innerHTML = '📥 Import Settings';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => this.importSettings(e);
        importBtn.onclick = () => fileInput.click();

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'settings-actions';
        buttonContainer.style.marginBottom = '20px';
        buttonContainer.appendChild(exportBtn);
        buttonContainer.appendChild(importBtn);
        buttonContainer.appendChild(fileInput);

        this.profileSection.appendChild(buttonContainer);

        // Add device info
        this.addDeviceInfo();

        // Insert at the top of the settings panel
        const content = this.settingsPanel.panel.querySelector('.settings-content');
        content.insertBefore(this.profileSection, content.firstChild);
    }

    addDeviceInfo() {
        const deviceInfo = this.getDeviceInfo();
        const infoContainer = document.createElement('div');
        infoContainer.className = 'device-info';
        infoContainer.style.fontSize = '12px';
        infoContainer.style.color = '#666';

        Object.entries(deviceInfo).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.style.marginBottom = '5px';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.innerHTML = `
                <span style="font-weight: 600">${key}:</span>
                <span style="color: #888">${value}</span>
            `;
            infoContainer.appendChild(row);
        });

        this.profileSection.appendChild(infoContainer);
    }

    getDeviceInfo() {
        return {
            'Window Size': `${window.innerWidth}×${window.innerHeight}`,
            'Screen Resolution': `${window.screen.width}×${window.screen.height}`,
            'Device Pixel Ratio': window.devicePixelRatio,
            'Aspect Ratio': (window.screen.width / window.screen.height).toFixed(2),
            'Browser': this.getBrowserInfo(),
            'Timestamp': new Date().toLocaleString()
        };
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Firefox/')) {
            browser = 'Firefox';
        } else if (ua.includes('Chrome/')) {
            browser = 'Chrome';
        } else if (ua.includes('Safari/')) {
            browser = 'Safari';
        } else if (ua.includes('Edge/')) {
            browser = 'Edge';
        }
        
        return browser;
    }

    exportSettings() {
        const deviceInfo = this.getDeviceInfo();
        const now = new Date();
        
        // Create the header comment
        const header = `/*
 * Circular Navigation Settings Export
 * Generated: ${now.toLocaleString()}
 *
 * System Information:
 * ------------------
 * Device: ${this.getDeviceType()}
 * Platform: ${navigator.platform}
 * Screen Size: ${window.screen.width}x${window.screen.height}
 * Viewport: ${window.innerWidth}x${window.innerHeight}
 * Pixel Ratio: ${window.devicePixelRatio}
 * Orientation: ${screen.orientation ? screen.orientation.type : 'unknown'}
 * User Agent: ${navigator.userAgent}
 */\n`;

        // Create the constants export
        const constants = `const CONSTANTS = ${JSON.stringify(this.settingsPanel.constants, null, 4)};`;

        // Combine and create download
        const content = header + constants;
        const blob = new Blob([content], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `circular-nav-settings-${now.toISOString().slice(0,10)}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Settings exported successfully!', 'success');
    }

    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                // Validate the imported settings
                if (!settings.constants || !settings.deviceInfo) {
                    throw new Error('Invalid settings file format');
                }

                // Update the constants
                Object.assign(this.settingsPanel.constants, settings.constants);
                
                // Update the visualization
                this.settingsPanel.updateVisualization();
                
                // Show success message
                this.showNotification('Settings imported successfully!', 'success');
                
                // Reset file input
                event.target.value = '';
            } catch (error) {
                this.showNotification('Error importing settings: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Extend the SettingsPanel class initialization
const originalInitialize = SettingsPanel.prototype.initialize;
SettingsPanel.prototype.initialize = function() {
    originalInitialize.call(this);
    this.profileManager = new ProfileManager(this);
    this.profileManager.initialize();
};
// TransitionManager class to handle smooth transitions
class TransitionManager {
    constructor() {
        this.currentTransitions = new Set();
    }

    transition(selection, duration = CONSTANTS.TRANSITION_DURATION) {
        const t = selection
            .transition()
            .duration(duration)
            .ease(d3.easeQuadInOut);
            
        this.currentTransitions.add(t);
        
        t.on('end', () => this.currentTransitions.delete(t));
        
        return t;
    }

    cancelAll() {
        this.currentTransitions.forEach(t => t.interrupt());
        this.currentTransitions.clear();
    }
}

function setupVisualization(data, dimensions, transitionManager) {
    const { width, height, radius, textSizes } = dimensions;

    // Clear any existing SVG content
    d3.select("#circular-nav-svg").selectAll("*").remove();

    // Create initial SVG and zoom container
    const { svg, zoomContainer } = createSVG(width, height);

    // Add a responsive resize behavior
    svg.attr("preserveAspectRatio", "xMidYMid meet");

    // Add zoom controls
    addZoomControls(svg, zoomContainer);

    // Create initial visualization
    updateVisualization(data, dimensions, transitionManager);
}

function updateVisualization(data, dimensions, transitionManager) {
    const { width, height, radius, textSizes } = dimensions;
    
    // Get existing elements
    const svg = d3.select("#circular-nav-svg");
    let zoomContainer = svg.select(".zoom-container");
    
    // Create zoom container if it doesn't exist
    if (zoomContainer.empty()) {
        zoomContainer = svg.append("g").attr("class", "zoom-container");
    }

    // Update viewBox
    transitionManager.transition(svg)
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Process data with new dimensions
    const root = processData(data, radius);

    // Update or create elements with transitions
    updateElements(root, dimensions, transitionManager);
}


// Enhanced cleanup function
function cleanup() {
    if (window.cleanupCircularNavigation) {
        window.cleanupCircularNavigation();
    }
    
    // Clear global variables
    window.currentData = null;
    window.lastSelectedNodeId = null;
    
    // Clean up SVG and get the cleanup function
    const svg = d3.select("#circular-nav-svg");
    if (!svg.empty()) {
        // Get the cleanup function we stored during creation
        const cleanupFn = svg.property("__cleanupFn");
        if (typeof cleanupFn === "function") {
            cleanupFn();
        }
        svg.selectAll("*").remove();
        svg.remove();
    }
}

function updateLinks(svg, root, linkGenerator) {
    return svg.selectAll("path.link")
        .data(root.links())
        .join(
            enter => enter.append("path").attr("class", "link"),
            update => update,
            exit => exit.remove()
        )
        .attr("d", linkGenerator)
        .style("stroke", getCSSVariable('--link-inactive'))
        .style("stroke-width", 1.5)
        .style("fill", "none")
        .style("opacity", d => (d.source.depth === 0) ? 1 : 0);
}

function updateElements(root, dimensions, transitionManager) {
    const { radius, textSizes } = dimensions;
    const svg = d3.select("#circular-nav-svg");
    const zoomContainer = svg.select(".zoom-container");

    // Clear existing content
    zoomContainer.selectAll("*").remove();

    // Create outer circle
    zoomContainer.append("circle")
        .attr("r", radius + CONSTANTS.DEPTH_TWO_RADIUS)
        .attr("fill", "none")
        .attr("stroke", getCSSVariable('--border-default'));

    // Create new elements
    const linkGenerator = createLinkGenerator(radius);
    const link = createLinks(zoomContainer, root, linkGenerator);
    const node = createNodes(zoomContainer, root);
    const { outerIndicators, outerTexts } = createOuterElements(zoomContainer, root, radius);

    // Update sizes and positions
    updateNodeSizes(node);
    positionNodes(node, root);

    // Set up event handlers
    const clickHandler = (event, d) => handleNodeClick(event, d, node, outerIndicators, outerTexts, link, root);
    
    node.on("click", clickHandler);
    outerIndicators.on("click", clickHandler);
    outerTexts.on("click", clickHandler);

    // Update text sizes based on breakpoint
    node.selectAll(".node-content")
        .style("font-size", d => {
            if (d.depth === 0) return `${textSizes.CENTER}px`;
            if (d.depth === 1) return `${textSizes.DEPTH_ONE}px`;
            return `${textSizes.DEPTH_TWO}px`;
        });

    // If there was a previously selected node, reselect it
    if (window.lastSelectedNodeId) {
        const selectedNode = root.descendants().find(d => d.data.id === window.lastSelectedNodeId);
        if (selectedNode) {
            handleNodeClick(null, selectedNode, node, outerIndicators, outerTexts, link, root);
        }
    }

    return { link, node, outerIndicators, outerTexts };
}

function createSVG(width, height) {
    // Ensure we have valid dimensions
    const safeWidth = Math.max(width || 800, 800);
    const safeHeight = Math.max(height || 600, Math.min(600, window.innerHeight * 0.7));
    
    let svg = d3.select("#circular-nav-svg");
    const container = d3.select(".circular-navigation-container");
    
    if (svg.empty()) {
        svg = container
            .append("svg")
            .attr("id", "circular-nav-svg");
    }
    
    // Set container style to enforce max height
    container
        .style("max-height", "70vh")
        .style("height", "70vh")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("overflow", "hidden"); // Prevent any potential overflow
    
    // Calculate aspect ratio
    const aspectRatio = safeWidth / safeHeight;
    
    // Use the full dimensions including padding
    svg
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", [
            -safeWidth / 2,
            -safeHeight / 2,
            safeWidth,
            safeHeight
        ])
        .style("max-width", "100%")
        .style("max-height", "70vh")
        .style("display", "block")
        .style("margin", "auto");

    console.log('SVG dimensions:', {
        width: safeWidth,
        height: safeHeight,
        aspectRatio,
        viewBox: [
            -safeWidth / 2,
            -safeHeight / 2,
            safeWidth,
            safeHeight
        ]
    });

    // Create zoom container
    const zoomContainer = svg.append("g")
        .attr("class", "zoom-container");

    // Add resize observer to maintain aspect ratio
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const containerWidth = entry.contentRect.width;
            const containerHeight = Math.min(entry.contentRect.height, window.innerHeight * 0.7);
            const currentRatio = containerWidth / containerHeight;
            
            if (currentRatio > aspectRatio) {
                // Container is wider than needed
                svg
                    .style("width", `${containerHeight * aspectRatio}px`)
                    .style("height", "100%");
            } else {
                // Container is taller than needed
                svg
                    .style("width", "100%")
                    .style("height", `${containerWidth / aspectRatio}px`);
            }
        }
    });

    resizeObserver.observe(container.node());

    // Store cleanup function
    svg.property("__cleanupFn", () => resizeObserver.disconnect());

    return { svg, zoomContainer };
}


// Add zoom control buttons
function addZoomControls(svg, zoomContainer) {
    const controls = d3.select(svg.node().parentNode)
        .append("div")
        .attr("class", "zoom-controls")
        .style("position", "absolute")
        .style("bottom", "5px")
        .style("left", "5px");

    
    
    let currentScale = 1;
    
    const zoom = d3.zoom()
    .scaleExtent([CONSTANTS.ZOOM.MIN_SCALE, CONSTANTS.ZOOM.MAX_SCALE])[1]

    controls.append("button")
        .text("+")
        .on("click", () => {
            currentScale = Math.min(3, currentScale * 1.2);
            zoomContainer.transition()
                .duration(250)
                .attr("transform", `scale(${currentScale})`);
        });
        
    controls.append("button")
        .text("1x")
        .on("click", () => {
            currentScale = 1;
            zoomContainer.transition()
                .duration(250)
                .attr("transform", "scale(1)");
        });

    controls.append("button")
        .text("-")
        .on("click", () => {
            currentScale = Math.max(0.5, currentScale * 0.8);
            zoomContainer.transition()
                .duration(250)
                .attr("transform", `scale(${currentScale})`);
        });


}

// Update the processData function to handle minimum radius
function processData(data, radius) {
    const root = d3.hierarchy(data);
    const tree = d3.tree()
        .size([2 * Math.PI, Math.max(radius * 0.8, CONSTANTS.MIN_RADIUS * 0.8)]) // Ensure tree radius is also bounded
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    tree(root);

    const depthTwoNodes = root.descendants().filter(d => d.depth === 2);
    const depthTwoCount = depthTwoNodes.length;
    if (depthTwoCount > 0) {
        const depthTwoAngleStep = (2 * Math.PI) / depthTwoCount;
        depthTwoNodes.forEach((node, i) => {
            node.x = i * depthTwoAngleStep;
            node.y = Math.max(radius + CONSTANTS.DEPTH_TWO_RADIUS, CONSTANTS.MIN_RADIUS + CONSTANTS.DEPTH_TWO_RADIUS);
        });
    }

    const depthOneNodes = root.children || [];
    depthOneNodes.forEach(node => {
        if (node.children && node.children.length > 0) {
            const childAngles = node.children.map(child => child.x);
            const minAngle = Math.min(...childAngles);
            const maxAngle = Math.max(...childAngles);
            
            let avgAngle;
            if (maxAngle - minAngle > Math.PI) {
                avgAngle = (minAngle + maxAngle + 2 * Math.PI) / 2 % (2 * Math.PI);
            } else {
                avgAngle = (minAngle + maxAngle) / 2;
            }
            
            node.x = avgAngle;
            node.y = Math.max(radius * 0.8, CONSTANTS.MIN_RADIUS * 0.8); // Ensure depth one nodes are properly positioned
        }
    });

    return root;
}

function createLinkGenerator(radius) {
    return function(d) {
        if (d.source.depth === 0) {
            const start = [0, 0];
            const end = project(d.target.x, d.target.y);
            return `M${start[0]},${start[1]}L${end[0]},${end[1]}`;
        } else {
            const radialLink = d3.linkRadial()
                .angle(d => d.x)
                .radius(d => {
                    if (d.depth === 2) return radius + CONSTANTS.DEPTH_TWO_RADIUS;
                    return d.y;
                });
            return radialLink(d);
        }
    };
}

// Example of consolidated createLinks function
function createLinks(svg, root, linkGenerator, isUpdate = false) {
    return svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("class", d => `link depth-${d.source.depth}-${d.target.depth}`)
        .attr("d", linkGenerator)
        .style("stroke", getCSSVariable('--link-inactive'))
        .style("stroke-width", isUpdate ? 1.5 : getCSSVariable('--link-width'))
        .style("fill", "none")
        .style("opacity", d => (d.source.depth === 0) ? 1 : 0);
}



function createNodes(svg, root) {
    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants().filter(d => d.depth < 2))
        .join("g")
        .attr("class", d => `node depth-${d.depth}-node`);

    // Create foreignObjects with proper dimensions
    const foreignObjects = node.append("foreignObject")
        .attr("class", d => `node-foreignObject ${d.depth === 0 ? 'central-node' : ''}`);

    // Create content divs with proper styling
    const contentDivs = foreignObjects.append("xhtml:div")
        .attr("class", d => `node-content ${d.depth === 0 ? 'central' : ''}`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("text-align", "center")
        .style("padding", `${CONSTANTS.NODE_SIZES.DEFAULT.PADDING}px`)
        .style("box-sizing", "border-box")
        .style("font-size", d => {
            if (d.depth === 0) return `${CONSTANTS.TEXT_SIZES.LARGE.CENTER}px`;
            if (d.depth === 1) return `${CONSTANTS.TEXT_SIZES.LARGE.DEPTH_ONE}px`;
            return `${CONSTANTS.TEXT_SIZES.LARGE.DEPTH_TWO}px`;
        })
        .text(d => d.data.name);

    // Add hover effects
    node.on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", function(d) {
                    if (d.depth === 0) return "translate(0,0) scale(1.1)";
                    const [x, y] = project(d.x, d.y);
                    return `translate(${x},${y}) scale(1.1)`;
                });
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", function(d) {
                    if (d.depth === 0) return "translate(0,0) scale(1)";
                    const [x, y] = project(d.x, d.y);
                    return `translate(${x},${y}) scale(1)`;
                });
        });

    return node;
}


function createOuterElements(svg, root, radius) {
    // Remove existing outer groups first
    svg.selectAll("g.outer-group").remove();
    
    const outerGroup = svg.append("g").attr("class", "outer-group");
    const depthTwoNodes = root.descendants().filter(d => d.depth === 2);
    
    const baseTextHeight = CONSTANTS.TEXT_LAYOUT.BASE_HEIGHT;
    const textWidth = CONSTANTS.TEXT_LAYOUT.WIDTH;
    const textPadding = CONSTANTS.TEXT_LAYOUT.PADDING;
    const baseSpacing = CONSTANTS.TEXT_LAYOUT.BASE_SPACING;
    const sideSpacingBoost = CONSTANTS.TEXT_LAYOUT.SIDE_SPACING_BOOST;
    const minTextSpacing = CONSTANTS.TEXT_LAYOUT.MIN_SPACING;
    
    // Get base text size based on screen width
    const getBaseTextSize = () => {
        const width = window.innerWidth;
        if (width < CONSTANTS.BREAKPOINTS.SMALL) {
            return CONSTANTS.TEXT_SIZES.SMALL.DEPTH_TWO;
        } else if (width < CONSTANTS.BREAKPOINTS.MEDIUM) {
            return CONSTANTS.TEXT_SIZES.MEDIUM.DEPTH_TWO;
        }
        return CONSTANTS.TEXT_SIZES.LARGE.DEPTH_TWO;
    };

    // Get adjusted text size based on length and base size
    const getAdjustedTextSize = (text, isMultiline = false) => {
        const baseSize = getBaseTextSize();
        if (isMultiline) {
            return Math.min(baseSize, CONSTANTS.TEXT_SIZES.SMALL.DEPTH_TWO);
        }
        return text.length > CONSTANTS.TEXT_LAYOUT.LONG_TEXT_THRESHOLD ? 
            Math.min(baseSize, CONSTANTS.TEXT_SIZES.SMALL.DEPTH_TWO) : 
            baseSize;
    };

    const angleStep = (2 * Math.PI) / depthTwoNodes.length;

    // Helper function to determine text layout strategy (unchanged)
    function getTextLayout(text) {
        const words = text.split(' ');
        const totalLength = text.length;
        const wordCount = words.length;

        if (wordCount === 1) {
            return {
                type: 'single',
                text: text
            };
        }

        if (totalLength < CONSTANTS.TEXT_LAYOUT.LONG_TEXT_THRESHOLD && wordCount <= 2) {
            return {
                type: 'single',
                text: text
            };
        }

        let midpoint = Math.ceil(wordCount / 2);
        const firstHalf = words.slice(0, midpoint).join(' ');
        const secondHalf = words.slice(midpoint).join(' ');
        
        if (firstHalf.length > secondHalf.length * 1.5) {
            midpoint -= 1;
        }
        
        return {
            type: 'double',
            firstLine: words.slice(0, midpoint).join(' '),
            secondLine: words.slice(midpoint).join(' ')
        };
    }

    // Calculate text position (unchanged)
    function calculateTextPosition(angle, indicatorRadius, textWidth, baseTextHeight, layout) {
        let normalizedAngle = angle;
        while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
        while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;
        
        const sideProximity = Math.abs(Math.cos(angle));
        const dynamicSpacing = baseSpacing + (sideSpacingBoost * Math.pow(sideProximity, 1.5));    
        
        const textRadius = indicatorRadius + dynamicSpacing;
        let textX = textRadius * Math.cos(angle);
        let textY = textRadius * Math.sin(angle);
        
        textX -= textWidth/2;
        textY -= layout.type === 'single' ? baseTextHeight/4 : baseTextHeight/2;
        
        return { x: textX, y: textY };
    }

    // Calculate initial positions (unchanged)
    const textPositions = [];
    depthTwoNodes.forEach((node, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const indicatorRadius = radius + CONSTANTS.DEPTH_TWO_RADIUS;
        const textLayout = getTextLayout(node.data.name);
        
        const position = calculateTextPosition(
            angle,
            indicatorRadius,
            textWidth,
            baseTextHeight,
            textLayout
        );
        
        textPositions.push({
            node,
            x: position.x,
            y: position.y,
            angle,
            height: textLayout.type === 'single' ? baseTextHeight/2 : baseTextHeight
        });
    });

    // Create and position indicators (unchanged)
    const indicatorGroups = outerGroup.selectAll("g.indicator-group")
        .data(depthTwoNodes, d => d.data.id)
        .join(
            enter => {
                const group = enter.append("g")
                    .attr("class", "indicator-group");
                
                group.append("circle")
                    .attr("class", "outer-indicator")
                    .attr("r", CONSTANTS.INDICATORS.INNER_RADIUS)
                    .attr("cx", 0)
                    .attr("cy", 0);
                
                group.append("circle")
                    .attr("class", "indicator-outline")
                    .attr("r", CONSTANTS.INDICATORS.OUTER_RADIUS)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .style("fill", "none")
                    .style("opacity", 0);
                
                return group;
            },
            update => update,
            exit => exit.remove()
        );
        
        // Update hover/active states if needed
        indicatorGroups.on('mouseover', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', function(d) {
                    const scale = CONSTANTS.INDICATORS.ACTIVE_SCALE;
                    return `${d3.select(this).attr('transform')} scale(${scale})`;
                });
        });

    // Position indicator groups (unchanged)
    depthTwoNodes.forEach((node, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const indicatorRadius = radius + CONSTANTS.DEPTH_TWO_RADIUS;
        const x = indicatorRadius * Math.cos(angle);
        const y = indicatorRadius * Math.sin(angle);
        
        indicatorGroups.filter(d => d === node)
            .attr("transform", `translate(${x},${y})`);
    });

    // Create and position text elements with updated text size logic
    const outerTexts = outerGroup.selectAll("foreignObject.outer-text-container")
        .data(depthTwoNodes, d => d.data.id)
        .join("foreignObject")
        .attr("class", "outer-text-container");

    textPositions.forEach(position => {
        const textLayout = getTextLayout(position.node.data.name);
        
        outerTexts.filter(d => d === position.node)
            .attr("width", textWidth)
            .attr("height", baseTextHeight)
            .attr("x", position.x)
            .attr("y", position.y)
            .each(function() {
                const container = d3.select(this);
                container.selectAll("div.outer-text")
                    .data([position.node])
                    .join("xhtml:div")
                    .attr("class", "outer-text")
                    .style("width", textWidth + "px")
                    .style("height", textLayout.type === 'single' ? 
                        baseTextHeight/2 + "px" : baseTextHeight + "px")
                    .style("display", "flex")
                    .style("flex-direction", "column")
                    .style("align-items", "center")
                    .style("justify-content", "center")
                    .style("text-align", "center")
                    .style("padding", `${textPadding}px`)
                    .style("box-sizing", "border-box")
                    .style("overflow", "hidden")
                    .html(d => {
                        const layout = getTextLayout(d.data.name);
                        if (layout.type === 'single') {
                            const fontSize = getAdjustedTextSize(layout.text);
                            return `<div class="line-clamp-1" style="font-size: ${fontSize}px">
                                ${layout.text}
                            </div>`;
                        } else {
                            const fontSize = getAdjustedTextSize(layout.firstLine, true);
                            return `
                                <div class="line-clamp-1" style="font-size: ${fontSize}px">
                                    ${layout.firstLine}
                                </div>
                                <div class="line-clamp-1" style="font-size: ${fontSize}px">
                                    ${layout.secondLine}
                                </div>
                            `;
                        }
                    });
            });
    });

    return { 
        outerIndicators: indicatorGroups.selectAll(".outer-indicator"),
        outerTexts
    };
}

function updateNodeSizes(node) {
    node.each(function(d) {
        const fo = d3.select(this).select("foreignObject");
        const div = fo.select("div");
        
        if (d.depth === 0) {
            // Central node
            const size = CONSTANTS.NODE_SIZES.CENTRAL.WIDTH;
            fo.attr("width", size)
              .attr("height", size)
              .attr("x", -size / 2)
              .attr("y", -size / 2);
              
            div.style("width", `${size}px`)
               .style("height", `${size}px`);
        } else {
            // Depth one nodes
            const width = Math.max(CONSTANTS.NODE_SIZES.DEFAULT.MIN_WIDTH, 
                                 CONSTANTS.NODE_SIZES.DEFAULT.MIN_WIDTH + CONSTANTS.NODE_SIZES.DEFAULT.PADDING);
            const height = Math.max(CONSTANTS.NODE_SIZES.DEFAULT.MIN_HEIGHT,
                                  CONSTANTS.NODE_SIZES.DEFAULT.MIN_HEIGHT + CONSTANTS.NODE_SIZES.DEFAULT.PADDING);
            
            fo.attr("width", width)
              .attr("height", height)
              .attr("x", -width / 2)
              .attr("y", -height / 2);
              
            div.style("width", `${width}px`)
               .style("height", `${height}px`);
        }
    });
}





function positionNodes(node, root) {
    node.attr("transform", d => {
        if (d.depth === 0) return "translate(0,0)";
        const [x, y] = project(d.x, d.y);
        return `translate(${x},${y})`;
    });
}

function setupEventListeners(node, outerIndicators, outerTexts, link, root) {
    const elements = [node, outerIndicators, outerTexts];
    elements.forEach(el => {
        el.on("click keydown", (event, d) => {
            if (event.type === 'click' || event.key === 'Enter') {
                handleNodeClick(event, d, node, outerIndicators, outerTexts, link, root);
            }
        });
    });
}



function handleNodeClick(event, d, node, outerIndicators, outerTexts, link, root) {
    if (!d) return; // Guard against undefined node
    
    if (event) {
        event.stopPropagation();
    }
    
    // Get all indicator groups
    const indicatorGroups = d3.selectAll(".indicator-group");
    
    // Update nodes and basic indicator classes
    node.classed("active", n => {
        if (!n) return false;
        return n === d || 
               (d.parent && n === d.parent) || 
               (d.depth === 2 && d.parent && d.parent.parent && n === d.parent.parent);
    });
    
    // Update indicators and their animations
    indicatorGroups.each(function(n) {
        if (!n) return;
        
        const group = d3.select(this);
        const isActive = n === d || 
                        (d.depth === 1 && d.children && n.parent === d) || 
                        (d.depth === 2 && n === d);
        
        // Only pulse if node is active and it's a depth-2 node click
        const shouldPulse = isActive && (d.depth === 2 && n === d);
        
        // Update main indicator
        const indicator = group.select(".outer-indicator");
        indicator
            .classed("active", isActive)
            .classed("pulse", shouldPulse);
    });

    // Update node content styles
    node.select(".node-content")
        .style("background-color", n => {
            if (!n) return getCSSVariable('--node-bg-default');
            if (n.depth === 0) return getCSSVariable('--node-bg-central');
            if (n === d) return getCSSVariable('--node-bg-active');
            if (d.parent && n === d.parent) return getCSSVariable('--node-bg-active');
            if (d.depth === 2 && d.parent && n === d.parent.parent) return getCSSVariable('--node-bg-active');
            return getCSSVariable('--node-bg-default');
        })
        .style("color", n => {
            if (!n) return getCSSVariable('--text-default');
            return (n === d || (d.parent && n === d.parent) || n.depth === 0) 
                ? getCSSVariable('--text-active') 
                : getCSSVariable('--text-default');
        });

    // Update links with safe checks
    link.transition()
        .duration(CONSTANTS.TRANSITION_DURATION)
        .ease(d3.easeElastic)
        .style("stroke", l => {
            if (!l || !l.source || !l.target) return getCSSVariable('--link-inactive');
            return isActivePath(l, d) ? getCSSVariable('--link-active') : getCSSVariable('--link-inactive');
        })
        .style("stroke-width", l => {
            if (!l) return getCSSVariable('--link-width');
            return isActivePath(l, d) ? getCSSVariable('--link-width-active') : getCSSVariable('--link-width');
        })
        .attr("class", l => {
            if (!l) return "link";
            return isSiblingPath(l, d) ? "link sibling" : "link";
        })
        .style("opacity", l => {
            if (!l || !l.source || !l.target) return 1;
            if (l.source.depth === 1 && l.target.depth === 2) {
                if (d.depth === 0) return 1;
                if (d.depth === 1) return l.source === d ? 1 : 0;
                if (d.depth === 2 && d.parent) return l.source === d.parent ? 1 : 0;
            }
            return 1;
        });

    // Update outer texts with safe checks
    outerTexts.classed("active", n => {
        if (!n || !n.parent) return false;
        return n === d || 
               (d.depth === 1 && n.parent === d) || 
               (d.depth === 2 && n === d);
    })
    .classed("faded", n => {
        if (!n || !n.parent) return false;
        if (d.depth === 1) return n.parent !== d;
        if (d.depth === 2 && d.parent) return n !== d && n.parent !== d.parent;
        return false;
    });

    // Store the last selected node ID in window scope
    if (d && d.data && d.data.id) {
        window.lastSelectedNodeId = d.data.id;
        
        // Only fetch content if dilemma tab is active
        if (isDilemmaTabActive()) {
            fetchRelatedPostContent(d.data.id);
        } else {
            clearContentContainer();
        }
    }
}


const contentCache = new Map();
const cacheStats = { hits: 0, misses: 0 };

function fetchRelatedPostContent(postId) {
    const contentContainer = document.getElementById('t2-content-container');
    if (contentContainer) {
        contentContainer.innerHTML = '<div class="t2-preloader">Loading...</div>';

        if (contentCache.has(postId)) {
            cacheStats.hits++;
            console.log(`Cache hit for post ID: ${postId}. Total hits: ${cacheStats.hits}`);
            const cachedContent = contentCache.get(postId);
            // Use requestAnimationFrame for smoother rendering
            requestAnimationFrame(() => {
                contentContainer.innerHTML = cachedContent.html;
                initializeElementorAndSlick(contentContainer);
            });
            return Promise.resolve();
        }

        cacheStats.misses++;
        console.log(`Cache miss for post ID: ${postId}. Total misses: ${cacheStats.misses}`);

        return fetch(`/wp-json/my-custom-route/v1/elementor-content/${postId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(`Caching content for post ID: ${postId}`);
                const processedContent = processContent(data.content);
                contentCache.set(postId, processedContent);
                contentContainer.innerHTML = processedContent.html;
                initializeElementorAndSlick(contentContainer);
                console.log(`Current cache size: ${contentCache.size} items`);
            })
            .catch(error => {
                console.error('Error fetching post content:', error);
                contentContainer.innerHTML = '<p>Error loading content. Please try again.</p>';
            });
    }
}

function processContent(content) {
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = content;

    const styles = tempContainer.querySelectorAll('style');
    const stylesHtml = Array.from(styles).map(style => style.outerHTML).join('');

    const elementorContent = tempContainer.querySelector('.elementor');
    const contentHtml = elementorContent ? elementorContent.outerHTML : content;

    return {
        html: stylesHtml + contentHtml,
        styles: styles
    };
}

function initializeElementorAndSlick(container) {
    // Check if Elementor frontend is available
    if (window.elementorFrontend) {
        // Run the ready trigger only for the new elements within the container
        jQuery(container).find('.elementor-element').each(function() {
            const $element = jQuery(this);
            if (!$element.hasClass('elementor-element-edit-mode')) {
                elementorFrontend.elementsHandler.runReadyTrigger($element);
            }
        });
    } else {
        console.error('Elementor frontend not available');
    }

    // Initialize Slick carousel if present
    if (window.jQuery && jQuery.fn.slick) {
        jQuery(container).find('.elementor-carousel').each(function() {
            const $carousel = jQuery(this);
            if ($carousel.hasClass('slick-initialized')) {
                $carousel.slick('unslick');
            }
            $carousel.slick();
        });
    }
}

function cleanupCache(maxSize = CONSTANTS.CACHE.MAX_SIZE) {
    if (contentCache.size > maxSize) {
        const entriesToRemove = contentCache.size - maxSize;
        const entries = Array.from(contentCache.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        for (let i = 0; i < entriesToRemove; i++) {
            contentCache.delete(entries[i][0]);
        }
        
        console.log(`Cleaned up cache. New size: ${contentCache.size}`);
    }
}

function preloadCacheContent(postIds) {
    postIds.forEach(postId => {
        if (!contentCache.has(postId)) {
            fetch(`/wp-json/my-custom-route/v1/elementor-content/${postId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Pre-loading content for post ID: ${postId}`);
                    const processedContent = processContent(data.content);
                    contentCache.set(postId, processedContent);
                    console.log(`Current cache size: ${contentCache.size} items`);
                })
                .catch(error => {
                    console.error(`Error pre-loading content for post ID: ${postId}`, error);
                });
        }
    });
}

function getPostIdsToPreload(data) {
    const postIds = [];
    
    function traverseTree(node) {
        if (node.id) {
            postIds.push(node.id);
        }
        if (node.children) {
            node.children.forEach(traverseTree);
        }
    }
    
    traverseTree(data);
    return postIds;
}

function isDilemmaTabActive() {
    const dilemmaTab = document.querySelector('button#dilemma[role="tab"]');
    console.log('Checking Dilemma Tab State:', {
        element: dilemmaTab,
        ariaSelected: dilemmaTab?.getAttribute('aria-selected'),
        isActive: dilemmaTab && dilemmaTab.getAttribute('aria-selected') === 'true'
    });
    return dilemmaTab && dilemmaTab.getAttribute('aria-selected') === 'true';
}


jQuery(document).ready(function($) {
    // Create a MutationObserver to watch for tab state changes
    const tabObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'aria-selected' &&
                mutation.target.id === 'dilemma') {
                    
                if (mutation.target.getAttribute('aria-selected') === 'true') {
                    if (window.lastSelectedNodeId) {
                        fetchRelatedPostContent(window.lastSelectedNodeId);
                    } else {
                        loadRootNodeContent();
                    }
                } else {
                    clearContentContainer();
                }
            }
        });
    });

    // Configure the observer
    const observerConfig = {
        attributes: true,
        attributeFilter: ['aria-selected']
    };

    // Start observing the dilemma tab
    const dilemmaTab = document.querySelector('button#dilemma[role="tab"]');
    if (dilemmaTab) {
        console.log('Starting observation of dilemma tab');
        tabObserver.observe(dilemmaTab, observerConfig);
    } else {
        console.log('Dilemma tab not found');
    }

    // Main initialization through AJAX
    $.ajax({
        url: circularNavData.ajaxurl,
        type: 'POST',
        data: {
            action: 'fetch_hierarchical_posts',
            post_type: circularNavData.post_type,
            nonce: circularNavData.nonce
        },
        success: function(response) {
            if (response.success) {
                initializeCircularNavigation(response.data);
                
                // After initialization, schedule pre-loading
                setTimeout(() => {
                    const postIdsToPreload = getPostIdsToPreload(response.data);
                    preloadCacheContent(postIdsToPreload);
                }, CONSTANTS.CACHE.PRELOAD_DELAY);
            } else {
                console.error("Error in AJAX response:", response);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("AJAX error:", textStatus, errorThrown);
        }
    });
});


function loadRootNodeContent() {
    // First check if the SVG exists
    const svg = d3.select('#circular-nav-svg');
    if (svg.empty()) {
        console.log('SVG element not found');
        return;
    }

    // Try to select the root node with proper error handling
    const rootNode = svg.select('.depth-0-node');
    if (rootNode.empty()) {
        console.log('Root node not found');
        return;
    }

    // Safely access the data
    const rootData = rootNode.datum();
    if (!rootData || !rootData.data || !rootData.data.id) {
        console.log('Root node data not available');
        return;
    }

    console.log('Loading root node content:', rootData.data.id);
    fetchRelatedPostContent(rootData.data.id);
}

function clearContentContainer() {
    const contentContainer = document.getElementById('t2-content-container');
    if (contentContainer) {
        contentContainer.innerHTML = '';
        console.log('Content container cleared');
    } else {
        console.log('Content container not found');
    }
}

// Single elementor/frontend/init handler
jQuery(window).on('elementor/frontend/init', function() {
    elementorFrontend.hooks.addAction('frontend/element_ready/tabs.default', function($scope) {
        $scope.find('.elementor-tab-title').on('click', function() {
            var tabId = jQuery(this).attr('aria-controls');
            var $tabContent = jQuery('#' + tabId);
            
            if ($tabContent.find('#circular-nav-svg').length > 0) {
                setTimeout(function() {
                    initializeCircularNavigation(circularNavData);
                }, 100);
            }
        });
    });
});
