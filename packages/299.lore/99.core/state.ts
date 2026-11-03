import { BehaviorSubject } from 'rx-lite'
import { Subject } from 'rx-lite'
import { Action } from './interface/action.interface.js'

import UnitModel from '../BEE.js'
import * as Effect from '../BEE.js'

export default class State extends BehaviorSubject<any> {
    public hunt: any
    public value: any
    public pivot: any
    public bus: any

    private dispatcher: Subject<any> = new Subject()

    constructor(init: UnitModel = new UnitModel()) {
        super(init)

        this.hunt = (typ: string, obj: any = {}) => {
            let slv: any
            const promo = new Promise((rslv) => {
                slv = rslv
            })
            if (obj == null) obj = {}
            if (obj.slv == null) {
                obj.slv = (val0: any) => slv(val0)
            } else {
                const origSlv = obj.slv
                obj.slv = (val0: any) => {
                    origSlv(val0)
                    slv(val0)
                }
            }
            this.dispatch({ type: typ, bale: obj })
            return promo
        }

        this.dispatcher
            .scan((state, action) => this.reducedApp(state, action), init)
            .subscribe((state) => {
                super.onNext(state)
            })
    }

    reducedApp(nextState: any, key: any) {
        for (var k in Effect.reducer)
            nextState[k] = Effect.reducer[k](nextState[k], key, this)
        return nextState
    }

    dispatch(value: Action) {
        var result = this.dispatcher.onNext(value)
        return result
    }

    pat(value: Action) {
        this.dispatch(value)
    }

    next(value: any) {
        this.dispatcher.onNext(value)
    }
}
