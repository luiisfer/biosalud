
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DbService } from '../services/db.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
    const db = inject(DbService);
    const router = inject(Router);

    const checkRole = () => {
        const user = db.currentUser();
        if (user && user.role === 'Admin') {
            return true;
        }
        // Redirect non-admins to dashboard
        return router.createUrlTree(['/dashboard']);
    };

    // If init is done, check immediately
    if (db.authInitialized()) {
        return checkRole();
    }

    // Otherwise wait for auth (guards run sequentially, but this is safer)
    return toObservable(db.authInitialized).pipe(
        filter(initialized => initialized),
        take(1),
        map(() => checkRole())
    );
};
