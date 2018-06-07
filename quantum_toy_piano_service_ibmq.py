from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, QuantumProgram
from qiskit import available_backends, execute
from math import *
import numpy as np
from flask import Flask, jsonify, request
import copy
from s04_rotcircuit_ibmq import *

app = Flask(__name__)

DEGREES_OF_FREEDOM = 6
NUM_PITCHES = 4
DIATONIC_SCALE_OCTAVE_PITCHES = 8
NUM_CIRCUIT_WIRES = 3
TOTAL_MELODY_NOTES = 7

###
# Produces a musical (specifically second-species counterpoint) composition for
# a given initial pitch, and melodic/harmonic rotations degrees. This operates in a degraded mode,
# in that a call to the quantum computer or simulator is made for each note in the resulting
# composition.
#    Parameters:
#        pitch_index Index (0 - 3) of the initial pitch for which a composition is desired. This determines
#                    the mode (Ionian, Dorian, etc.) of the composition
#        species Number (1 - 3) representing the species of counterpoint desired
#        melodic_degrees Comma-delimited string containing 28 rotations in degrees for melody matrix
#        harmonic_degrees Comma-delimited string containing 28 rotations in degrees for harmony matrix
#
#    Returns JSON string containing:
#        melody_part
#            pitch_index
#            start_beat
#            pitch_probs
#        harmony_part
#            pitch_index
#            start_beat
#            pitch_probs
#
#        pitch_index is an integer from (0 - 7) resulting from measurement
#        start_beat is the beat in the entire piece for which the note was produced
#        pitch_probs is an array of eight probabilities from which the pitch_index resulted
###

@app.route('/toy_piano_counterpoint')
def toy_piano_counterpoint():
    pitch_index = int(request.args['pitch_index'])
    if (pitch_index >= NUM_PITCHES):
        pitch_index %= (DIATONIC_SCALE_OCTAVE_PITCHES - 1)
    #print("pitch_index: ", pitch_index)

    species = int(request.args['species'])
    #print("species: ", species)

    melodic_degrees = request.args['melodic_degrees'].split(",")
    #print("melodic_degrees: ", melodic_degrees)

    harmonic_degrees = request.args['harmonic_degrees'].split(",")
    #print("harmonic_degrees: ", harmonic_degrees)

    use_simulator = request.args['use_simulator'].lower() == "true"
    print("use_simulator: ", use_simulator)

    if (len(melodic_degrees) == DEGREES_OF_FREEDOM and
            len(harmonic_degrees) == DEGREES_OF_FREEDOM and
            1 <= species <= 3 and
            0 <= pitch_index < NUM_PITCHES):

        q = QuantumRegister(3)
        c = ClassicalRegister(3)
        qc = QuantumCircuit(q, c)

        rot_melodic_circuit = compute_circuit(melodic_degrees, q, c, qc)

        rot_harmonic_circuit = compute_circuit(harmonic_degrees, q, c, qc)

        harmony_notes_factor = 2**(species - 1)  # Number of harmony notes for each melody note
        num_composition_bits = TOTAL_MELODY_NOTES * (harmony_notes_factor + 1) * NUM_CIRCUIT_WIRES

        if use_simulator:
            quantum_backend = "local_qasm_simulator"
        else:
            # TODO: Modify to use real quantum chip
            quantum_backend = "local_qasm_simulator"

        composition_bits = [0] * num_composition_bits

        # Convert the pitch index to a binary string, and place into the
        # composition_bits array, least significant bits in lowest elements of array
        qubit_string = format(pitch_index, '03b')
        for idx, qubit_char in enumerate(qubit_string):
            if qubit_char == '0':
                composition_bits[idx] = 0
            else:
                composition_bits[idx] = 1

        num_runs = 1

        for melody_note_idx in range(0, TOTAL_MELODY_NOTES):
            #
            if (melody_note_idx < TOTAL_MELODY_NOTES - 1):

                qp = QuantumProgram()
                input_q = QuantumRegister(3)
                input_c = ClassicalRegister(3)
                input_qc = QuantumCircuit(input_q, input_c)

                for bit_idx in range(0, NUM_CIRCUIT_WIRES):
                    if (composition_bits[melody_note_idx * NUM_CIRCUIT_WIRES + bit_idx] == 0):
                        input_qc.iden(input_q[NUM_CIRCUIT_WIRES - 1 - bit_idx])
                    else:
                        input_qc.x(input_q[NUM_CIRCUIT_WIRES - 1 - bit_idx])

                qp.add_circuit("input_qubits", input_qc)
                # print("----input_qubits----")
                # print(qp.get_qasm("input_qubits"))
                # print("----end input_qubits----")

                qp.add_circuit("rot_melodic", rot_melodic_circuit)
                # print("----rot_melodic----")
                # print(qp.get_qasm("rot_melodic"))
                # print("----end rot_melodic----")

                sim_result = qp.execute(backend = quantum_backend, shots = 1)

                # Show the results
                print("simulation: ", sim_result)
                bitstr = list(sim_result.get_counts("rot_melodic").keys())[0]
                print("bitstr:")
                print(bitstr)

                ##TODO LEFT OFF HERE

            #     bits = result[0]
            #     for bit_idx in range(0, NUM_CIRCUIT_WIRES):
            #         composition_bits[(melody_note_idx + 1) * NUM_CIRCUIT_WIRES + bit_idx] = bits[bit_idx]
            #
            #     #print(composition_bits)
            #
            #     measured_pitch = bits[0] * 4 + bits[1] * 2 + bits[2]
            #     #print("melody melody_note_idx measured_pitch")
            #     #print(melody_note_idx)
            #     #print(measured_pitch)
            #
            # # Now compute a harmony note for the melody note
            # #print("Now compute a harmony note for the melody notev")
            # p = Program()
            #
            # for bit_idx in range(0, NUM_CIRCUIT_WIRES):
            #     if composition_bits[melody_note_idx * NUM_CIRCUIT_WIRES + bit_idx] == 0:
            #         p.inst(I(NUM_CIRCUIT_WIRES - 1 - bit_idx))
            #     else:
            #         p.inst(X(NUM_CIRCUIT_WIRES - 1 - bit_idx))
            #
            # p.inst(copy.deepcopy(rot_harmonic_circuit))
            # p.inst().measure(0, 0).measure(1, 1) \
            #     .measure(2, 2)
            # #print("rot_harmonic_circuit:")
            # #print(p)
            #
            # result = q_con.run(p, [2, 1, 0], num_runs)
            # bits = result[0]
            # for bit_idx in range(0, NUM_CIRCUIT_WIRES):
            #     composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
            #                      (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx] = bits[bit_idx]
            #
            # #print(composition_bits)
            #
            # measured_pitch = bits[0] * 4 + bits[1] * 2 + bits[2]
            # #print("harmony melody_note_idx measured_pitch")
            # #print(melody_note_idx)
            # #print(measured_pitch)
            #
            #
            # # Now compute melody notes to follow the harmony note
            # #print("Now compute melody notes to follow the harmony note")
            # for harmony_note_idx in range(1, harmony_notes_factor):
            #     p = Program()
            #
            #     for bit_idx in range(0, NUM_CIRCUIT_WIRES):
            #         if (composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
            #                              ((harmony_note_idx - 1) * NUM_CIRCUIT_WIRES) +
            #                              (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx] == 0):
            #             p.inst(I(NUM_CIRCUIT_WIRES - 1 - bit_idx))
            #         else:
            #             p.inst(X(NUM_CIRCUIT_WIRES - 1 - bit_idx))
            #
            #     p.inst(copy.deepcopy(rot_melodic_circuit))
            #     p.inst().measure(0, 0).measure(1, 1) \
            #         .measure(2, 2)
            #     #print("rot_melodic_circuit:")
            #     #print(p)
            #
            #     result = q_con.run(p, [2, 1, 0], num_runs)
            #     bits = result[0]
            #     for bit_idx in range(0, NUM_CIRCUIT_WIRES):
            #         composition_bits[(melody_note_idx * NUM_CIRCUIT_WIRES * harmony_notes_factor) +
            #                           ((harmony_note_idx) * NUM_CIRCUIT_WIRES) +
            #                          (TOTAL_MELODY_NOTES * NUM_CIRCUIT_WIRES) + bit_idx] = bits[bit_idx]
            #
            #     #print(composition_bits)
            #
            #     measured_pitch = bits[0] * 4 + bits[1] * 2 + bits[2]
            #     #print("melody after harmony melody_note_idx measured_pitch")
            #     #print(melody_note_idx)
            #     #print(measured_pitch)

        all_note_nums = create_note_nums_array(composition_bits)
        melody_note_nums = all_note_nums[0:TOTAL_MELODY_NOTES]
        harmony_note_nums = all_note_nums[7:num_composition_bits]

    if use_simulator:
        composer = "Rigetti QVM"
    else:
        composer = "Rigetti " + "8Q-Agave"

    ret_dict = {"melody": melody_note_nums,
                "harmony": harmony_note_nums,
                "lilypond": create_lilypond(melody_note_nums, harmony_note_nums, composer),
                "toy_piano" : create_toy_piano(melody_note_nums, harmony_note_nums)}

    return jsonify(ret_dict)


def create_note_nums_array(ordered_classical_registers):
    allnotes_array = []
    cur_val = 0
    for idx, bit in enumerate(ordered_classical_registers):
        if idx % 3 == 0:
            cur_val += bit * 4
        elif idx % 3 == 1:
            cur_val += bit * 2
        else:
            cur_val += bit
            allnotes_array.append(cur_val)
            cur_val = 0
    return allnotes_array


def pitch_letter_by_index(pitch_idx):
    retval = "z"
    if pitch_idx == 0:
        retval = "c"
    elif pitch_idx == 1:
        retval = "d"
    elif pitch_idx == 2:
        retval = "e"
    elif pitch_idx == 3:
        retval = "f"
    elif pitch_idx == 4:
        retval = "g"
    elif pitch_idx == 5:
        retval = "a"
    elif pitch_idx == 6:
        retval = "b"
    elif pitch_idx == 7:
        retval = "c'"
    else:
        retval = "z"
    return retval


# Produce output for Lilypond
def create_lilypond(melody_note_nums, harmony_note_nums, composer):
    harmony_notes_fact = int(len(harmony_note_nums) / len(melody_note_nums))
    retval = "\\version \"2.18.2\" \\paper {#(set-paper-size \"a5\")} \\header {title=\"Schrodinger's Cat\" subtitle=\"on a Toy Piano\" composer = \"" + composer + "\"}  melody = \\absolute { \\clef \"bass\" \\numericTimeSignature \\time 4/4 \\tempo 4 = 100"
    for pitch in melody_note_nums:
        retval += " " + pitch_letter_by_index(pitch) + "2"

    # Add the same pitch to the end of the melody as in the beginning
    retval += " " + pitch_letter_by_index(melody_note_nums[0]) + "2"

    retval += "} harmony = \\absolute { \\clef \"treble\" \\numericTimeSignature \\time 4/4 "
    for pitch in harmony_note_nums:
        retval += " " + pitch_letter_by_index(pitch) + "'" + str(int(harmony_notes_fact * 2))

    # Add the same pitch to the end of the harmony as in the beginning of the melody,
    # only an octave higher
    retval += " " + pitch_letter_by_index(melody_note_nums[0]) + "'2"

    retval += "} \\score { << \\new Staff \\with {instrumentName = #\"Harmony\"}  { \\harmony } \\new Staff \\with {instrumentName = #\"Melody\"}  { \\melody } >> }"
    return retval

# Produce output for toy piano
def create_toy_piano(melody_note_nums, harmony_note_nums):
    harmony_notes_fact = int(len(harmony_note_nums) / len(melody_note_nums))
    quarter_note_dur = 150
    notes = []
    latest_melody_idx = 0
    latest_harmony_idx = 0
    num_pitches_in_octave = 7
    toy_piano_pitch_offset = 1

    for idx, pitch in enumerate(melody_note_nums):
        notes.append({"num": pitch + toy_piano_pitch_offset, "time": idx * quarter_note_dur * 2})
        latest_melody_idx = idx

    # Add the same pitch to the end of the melody as in the beginning
    notes.append({"num": melody_note_nums[0] + toy_piano_pitch_offset, "time": (latest_melody_idx + 1) * quarter_note_dur * 2})

    for idx, pitch in enumerate(harmony_note_nums):
        notes.append({"num": pitch + num_pitches_in_octave + toy_piano_pitch_offset, "time": idx * quarter_note_dur * 2 / harmony_notes_fact})
        latest_harmony_idx = idx

    # Add the same pitch to the end of the harmony as in the beginning of the melody,
    # only an octave higher
    notes.append({"num": melody_note_nums[0] + num_pitches_in_octave + toy_piano_pitch_offset, "time": (latest_harmony_idx + 1) * quarter_note_dur * 2 / harmony_notes_fact})

    # Sort the array of dictionaries by time
    sorted_notes = sorted(notes, key=lambda k: k['time'])

    return sorted_notes

if __name__ == '__main__':
    app.run()
