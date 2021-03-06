pragma solidity >= 0.6.0;

import { Layer2 } from "../storage/Layer2.sol";
import { OPRU, SplitRollUp } from "../libraries/Tree.sol";
import { RollUpLib } from "../libraries/Tree.sol";
import { SubTreeRollUpLib } from "../libraries/Tree.sol";
import { SMT254 } from "../libraries/SMT.sol";
import { Hash } from "../libraries/Hash.sol";


contract RollUpable is Layer2 {
    // using RollUpLib for *;
    using SubTreeRollUpLib for *;
    using SMT254 for SMT254.OPRU;

    enum RollUpType { UTXO, Nullifier, Withdrawal}

    event NewProofOfRollUp(RollUpType rollUpType, uint id);

    modifier requirePermission(RollUpType rollUpType, uint id) {
        require(
            Layer2.proof.permittedTo[uint8(rollUpType)][id] == msg.sender,
            "Not permitted to update this roll up"
        );
        _;
    }

    /** Roll up interaction functions */
    function newProofOfUTXORollUp(
        uint startingRoot,
        uint startingIndex,
        uint[] calldata initialSiblings
    ) external {
        SplitRollUp storage rollUp = Layer2.proof.ofUTXORollUp.push();
        rollUp.initWithSiblings(
            Hash.poseidon(),
            startingRoot,
            startingIndex,
            UTXO_SUB_TREE_DEPTH,
            initialSiblings
        );
        uint id = Layer2.proof.ofUTXORollUp.length - 1;
        Layer2.proof.permittedTo[uint8(RollUpType.UTXO)][id] = msg.sender;
        emit NewProofOfRollUp(RollUpType.UTXO, id);
    }

    function newProofOfNullifierRollUp(bytes32 prevRoot) external {
        SMT254.OPRU storage rollUp = Layer2.proof.ofNullifierRollUp.push();
        rollUp.prev = prevRoot;
        rollUp.next = prevRoot;
        rollUp.mergedLeaves = bytes32(0);
        uint id = Layer2.proof.ofNullifierRollUp.length - 1;
        Layer2.proof.permittedTo[uint8(RollUpType.Nullifier)][id] = msg.sender;
        emit NewProofOfRollUp(RollUpType.Nullifier, id);
    }

    function newProofOfWithdrawalRollUp(
        uint startingRoot,
        uint startingIndex
    ) external {
        SplitRollUp storage rollUp = Layer2.proof.ofWithdrawalRollUp.push();
        rollUp.init(startingRoot, startingIndex);
        uint id = Layer2.proof.ofWithdrawalRollUp.length - 1;
        Layer2.proof.permittedTo[uint8(RollUpType.Withdrawal)][id] = msg.sender;
        emit NewProofOfRollUp(RollUpType.Withdrawal, id);
    }

    function updateProofOfUTXORollUp(
        uint id,
        uint[] calldata leaves
    )
        external
        requirePermission(RollUpType.Withdrawal, id)
    {
        SplitRollUp storage rollUp = Layer2.proof.ofUTXORollUp[id];
        rollUp.update(
            Hash.poseidon(),
            UTXO_SUB_TREE_DEPTH,
            leaves
        );
    }

    function updateProofOfNullifierRollUp(
        uint id,
        bytes32[] calldata leaves,
        bytes32[254][] calldata siblings
    )
        external
        requirePermission(RollUpType.Nullifier, id)
    {
        SMT254.OPRU storage rollUp = Layer2.proof.ofNullifierRollUp[id];
        rollUp.update(leaves, siblings);
    }

    function updateProofOfWithdrawalRollUp(
        uint id,
        uint[] calldata initialSiblings,
        uint[] calldata leaves
    )
        external
        requirePermission(RollUpType.Withdrawal, id)
    {
        SplitRollUp storage rollUp = Layer2.proof.ofWithdrawalRollUp[id];
        rollUp.update(
            Hash.keccak(),
            WITHDRAWAL_SUB_TREE_DEPTH,
            initialSiblings,
            leaves
        );
    }
}
