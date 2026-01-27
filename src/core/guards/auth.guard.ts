
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { DbService } from '../services/db.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const db = inject(DbService);
    const router = inject(Router);

    // If already initialized, check immediately
    if (db.authInitialized()) {
        return db.currentUser() ? true : router.createUrlTree(['/login']);
    }

    // Otherwise wait for initialization
    return toObservable(db.authInitialized).pipe(
        filter(initialized => initialized),
        take(1),
        map(() => {
            if (db.currentUser()) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
