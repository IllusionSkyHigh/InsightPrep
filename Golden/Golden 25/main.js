/**
 * ============================================
 * MAIN APPLICATION COORDINATOR
 * ============================================
 * 
 * Purpose:
 * This is the main entry point and coordinator for the MockTest application.
 * It handles application initialization, DOM setup, and high-level coordination
 * between all application modules.
 * 
 * Key Responsibilities:
 * - Initialize the application after DOM content is loaded
 * - Set up copyright year and initial UI state
 * - Coordinate between all application modules
 * - Handle application-level error management
 * - Manage the overall application lifecycle
 * 
 * Dependencies:
 * - core-utils.js: Foundation utilities and library loading
 * - app-state.js: Application state management
 * - database-manager.js: Database operations
 * - ui-layout.js: UI layout and positioning
 * - test-engine.js: Test execution and scoring
 * - filter-panels.js: Filter panel construction and validation
 * - database-filter-panel.js: Database-specific filtering
 * - event-handlers.js: Event coordination and user interactions
 * 
 * Technical Features:
 * - Modular architecture with clear separation of concerns
 * - Centralized error handling and logging
 * - Graceful degradation when modules fail to load
 * - Automatic library loading and initialization
 * - Copyright year auto-update
 * 
 * Note: This file should contain minimal code - most functionality
 * has been extracted to specialized modules for better maintainability.
 * ============================================
 */

// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Initialize the application when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Set current year in footer copyright
        const currentYear = new Date().getFullYear();
        const copyrightYearElement = document.getElementById('swamys-copyright-year');
        if (copyrightYearElement) {
            copyrightYearElement.textContent = currentYear;
        }
        
        // Initialize layout system (from ui-layout.js)
        if (typeof initializeLayoutSystem === 'function') {
            initializeLayoutSystem();
        } else {
            console.warn('Layout system initialization function not found');
        }
        
        // Initialize all event listeners (from event-handlers.js)
        if (typeof initializeEventListeners === 'function') {
            initializeEventListeners();
        } else {
            console.error('Event listeners initialization function not found');
            showFallbackError('Event system not properly loaded');
        }
        
        // Log successful initialization
        console.log('MockTest application initialized successfully');
        
    } catch (error) {
        console.error('Error during application initialization:', error);
        showFallbackError('Failed to initialize application: ' + error.message);
    }
});

/**
 * Handle application-level errors when modules fail to load
 * @param {string} message - Error message to display
 */
function showFallbackError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f8d7da;
        color: #721c24;
        padding: 15px 20px;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        max-width: 90%;
        text-align: center;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 10000);
}

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', function(event) {
    console.error('Unhandled error:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the default browser behavior
});

// ============================================
// APPLICATION READY STATE
// ============================================

// Indicate that main.js has loaded successfully
window.MockTestMain = {
    version: '2.0.0',
    initialized: false,
    modules: {
        coreUtils: typeof escapeSQL === 'function',
        appState: typeof AppState === 'object',
        databaseManager: typeof executeSecureQuery === 'function',
        testEngine: typeof startTest === 'function',
        filterPanels: typeof buildFilterPanel === 'function',
        uiLayout: typeof updateCopyrightCardPosition === 'function',
        eventHandlers: typeof initializeEventListeners === 'function'
    }
};

// Set initialized flag after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.MockTestMain.initialized = true;
});

console.log('Main application coordinator loaded');