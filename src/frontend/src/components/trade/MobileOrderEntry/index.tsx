import { BaseModal } from '@/components/modals/BaseModal'
import React, { useState } from 'react'
import { OrderEntry } from '../OrderEntry'
import { ApiMarket } from '@/types/api'

const MobileOrderEntry = ({ marketData }: { marketData: ApiMarket }) => {
    const [modal, setModal] = useState<{
        side: 'buy' | 'sell',
        isOpen: boolean
    }>({
        side: 'buy',
        isOpen: false
    })

    const openModal = (side: 'buy' | 'sell') => () => {
        setModal({
            isOpen: true,
            side: side
        })
    }

    const closeModal = () => {
        setModal({
            ...modal,
            isOpen: false
        })
    }
    return (
        <div className='md:hidden'>
            <div className="flex fixed bottom-0 left-0 px-6 py-4 bg-fade gap-6 w-full">
                <button onClick={openModal('buy')}
                    className="bg-green text-neutral-800 text-center w-[calc(50%-12px)] font-medium h-9 cursor-pointer">Buy</button>
                <button onClick={openModal('sell')}
                    className="bg-red text-neutral-800 text-center w-[calc(50%-12px)] font-medium h-9 cursor-pointer">Sell</button>
            </div>

            <div className="">
                <BaseModal isOpen={modal.isOpen} onClose={closeModal} className="max-w-[284px] w-full !p-3 ">
                    <OrderEntry defaultSide={modal.side} marketData={marketData} />
                </BaseModal>
            </div>
        </div>
    )
}

export default MobileOrderEntry