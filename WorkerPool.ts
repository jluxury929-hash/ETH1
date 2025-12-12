// WorkerPool.ts

// ... (inside the private handleWorkerMessage method)

// Line 34: FIX TS2345 - Check if WorkerResult is null before passing to resolver
        const task = this.tasks.get(data.id);
        if (task && data.result) { // Check if data.result is not null
            task.resolver(data.result); // Pass only the non-null result
            this.tasks.delete(data.id);
        } else if (task && !data.result) {
            // Handle error case where worker failed and returned null/undefined result
            task.resolver({ success: false, message: "Worker failed to return a result." });
            this.tasks.delete(data.id);
        }

// ... (inside the public addTask method)

// Line 66: FIX TS2551 - The property is 'resolver', not 'resolve'
    // ...
    const wrapper: WorkerTaskWrapper = {
        id: taskId,
        data: taskData,
        resolver: resolve, // Corrected property name
        task: 'MEV_BUNDLE_EXECUTION' // FIX: TS2339/TS2353 - Added the 'task' property
    };

// ... (inside the private logStats method)

// Line 75: FIX TS2353 - Ensure 'totalWorkers' is added to the log object
    // ...
    const stats: WorkerStats = {
        // ... other properties
        totalWorkers: this.workers.length // FIX: Added the missing property
    };

// ...
